import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import {ApiService} from '../services/api.service';
import * as L from 'leaflet';

export interface RestaurantItem {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  cuisineType: string;
  priceRange: string;
  coverPhotoUrl: string;
  averageRating: number;
  reviewCount: number;
  image?: string;
  gallery?: string[];
  description?: string;
  specialOffer?: string;
  coords?: { x: number; y: number; lat: number; lng: number };
}

@Component({
  selector: 'app-restaurants',
  imports: [RouterLink, CommonModule, FormsModule, Footer],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.css',
})
export class Restaurants implements OnInit {
  searchCity = 'Paris';
  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 6;
  selectedDate = 'Today, Aug 18';
  @Input() showSearch = false;
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  selectedTime = '19:00';
  selectedGuests = 2;

  activeQuickFilters = new Set<string>();
  selectedCuisine = 'All';
  selectedPrice = 'All';
  selectedNeighborhood = 'All';
  sortBy = 'averageRating';

  restaurants: RestaurantItem[] = [];
  mapPins: RestaurantItem[] = [];
  loading = false;
  errorMessage = '';
  totalElements = 0;
  totalPages = 0;

  mobileMenuOpen = false;
  mobileMapOpen = false;
  allFiltersModalOpen = false;
  bookingModalOpen = false;
  selectedRestaurant: RestaurantItem | null = null;
  selectedTimeslot: any = null;
  hoveredRestaurantId: number | null = null;
  favorites = new Set<number>([1, 3]);
  bookingSuccess = false;

  isLoggedIn = false;
  userRole: string | null = null;
  user: any = null;

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map: any;
  private markersLayer: any = L.layerGroup();

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.checkLoginStatus();
    this.loadRestaurants();
  }

  ngAfterViewInit(): void {
    this.map = L.map(this.mapContainer.nativeElement, {
      center: [48.8566, 2.3522],
      zoom: 12,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
  }

  checkLoginStatus(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.userRole = this.user.role;

      const first = this.user.firstName?.charAt(0) || '';
      const last = this.user.lastName?.charAt(0) || '';
      this.user.initials = (first + last).toUpperCase() || 'U';
    } else {
      this.isLoggedIn = false;
      this.user = null;
      this.userRole = null;
    }
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    this.checkLoginStatus();
    this.router.navigate(['/']);
  }

  loadRestaurants(): void {
    this.loading = true;

    this.api.getRestaurants().then((data) => {
      this.restaurants = data || [];
      this.totalElements = this.restaurants.length;
      this.totalPages = 1;
      this.loading = false;

      this.renderMapMarkers();
    }).catch((error) => {
      console.error("Failed to fetch:", error);
      this.loading = false;
    });
  }

  renderMapMarkers(): void {
    if (!this.map) return;

    this.markersLayer.clearLayers();

    const bounds: any[] = [];

    this.restaurants.forEach((restaurant: any) => {
      if (restaurant.latitude && restaurant.longitude) {
        const isActive = this.hoveredRestaurantId === restaurant.id;

        const html = `
        <div class="thin-marker ${isActive ? 'active' : 'default'}">
          <span class="marker-price">${restaurant.priceRange || '€€'}</span>
          <span class="marker-rating">★ ${restaurant.averageRating?.toFixed(1) || 'N/A'}</span>
        </div>
      `;

        const myIcon = L.divIcon({
          className: 'thin-marker-icon',
          html: html,
          iconSize: [80, 28],
          iconAnchor: [40, 14],
          popupAnchor: [0, -14]
        });

        const marker = L.marker([restaurant.latitude, restaurant.longitude], { icon: myIcon })
          .bindPopup(`<strong>${restaurant.name}</strong><br>${restaurant.cuisineType} • ${restaurant.priceRange}`);

        marker.on('click', () => {
          this.selectedRestaurant = restaurant;
          this.hoveredRestaurantId = restaurant.id;
          this.refreshMapMarkers();
        });

        marker.addTo(this.markersLayer);
        bounds.push([restaurant.latitude, restaurant.longitude]);
      }
    });

    if (bounds.length > 0) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  }

  refreshMapMarkers(): void {
    if (!this.map) return;

    this.markersLayer.clearLayers();

    this.restaurants.forEach((restaurant: any) => {
      if (restaurant.latitude && restaurant.longitude) {
        const isActive = this.hoveredRestaurantId === restaurant.id;

        const html = `
        <div class="thin-marker ${isActive ? 'active' : 'default'}">
          <span class="marker-price">${restaurant.priceRange || '€€'}</span>
          <span class="marker-rating">★ ${restaurant.averageRating?.toFixed(1) || 'N/A'}</span>
        </div>
      `;

        const myIcon = L.divIcon({
          className: 'thin-marker-icon',
          html: html,
          iconSize: [80, 28],
          iconAnchor: [40, 14],
          popupAnchor: [0, -14]
        });

        const marker = L.marker([restaurant.latitude, restaurant.longitude], { icon: myIcon })
          .bindPopup(`<strong>${restaurant.name}</strong><br>${restaurant.cuisineType} • ${restaurant.priceRange}`);

        marker.on('click', () => {
          this.selectedRestaurant = restaurant;
          this.hoveredRestaurantId = restaurant.id;
          this.refreshMapMarkers();
        });

        marker.addTo(this.markersLayer);
      }
    });
  }

  zoomIn(): void {
    if (this.map) {
      this.map.zoomIn();
    }
  }

  zoomOut(): void {
    if (this.map) {
      this.map.zoomOut();
    }
  }

  onSortChange(): void {
    this.loadRestaurants();
  }

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.loadRestaurants();
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadRestaurants();
  }

  nextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  prevPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  toggleQuickFilter(filterName: string): void {
    if (this.activeQuickFilters.has(filterName)) {
      this.activeQuickFilters.delete(filterName);
    } else {
      this.activeQuickFilters.add(filterName);
    }
    this.currentPage = 1;
    this.loadRestaurants();
  }

  isQuickFilterActive(filterName: string): boolean {
    return this.activeQuickFilters.has(filterName);
  }

  onCuisineChange(): void {
    this.loadRestaurants();
  }

  onPriceChange(): void {
    this.loadRestaurants();
  }

  get filteredRestaurants(): RestaurantItem[] {
    return this.restaurants;
  }

  get paginatedRestaurants(): RestaurantItem[] {
    return this.restaurants;
  }

  selectRestaurantForMap(rest: RestaurantItem): void {
    this.selectedRestaurant = rest;
    this.hoveredRestaurantId = rest.id;
    this.refreshMapMarkers();
  }

  toggleFavorite(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
  }

  isFavorite(id: number): boolean {
    return this.favorites.has(id);
  }

  openBookingModal(rest: RestaurantItem, slot: any, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    this.selectedRestaurant = rest;
    this.selectedTimeslot = slot;
    this.bookingModalOpen = true;
    this.bookingSuccess = false;
  }

  confirmBooking(): void {
    this.bookingSuccess = true;
    setTimeout(() => {
      this.bookingModalOpen = false;
      this.bookingSuccess = false;
    }, 2500);
  }

  closeBookingModal(): void {
    this.bookingModalOpen = false;
  }

  scrollFilters(offset: number): void {
    const el = document.getElementById('filters-carousel');
    if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
  }

  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  toggleMobileMap(): void {
    this.mobileMapOpen = !this.mobileMapOpen;
  }
}
