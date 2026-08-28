import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import {ApiService} from '../services/api.service';

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

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      if (params['city']) this.searchCity = params['city'];
      if (params['q']) this.searchQuery = params['q'];
      this.loadRestaurants();
    });
  }

  loadRestaurants(): void {
    this.loading = true;
    this.errorMessage = '';

    this.api.getRestaurants(
      this.searchCity,
      this.searchQuery,
      this.selectedCuisine !== 'All' ? this.selectedCuisine : '',
      this.selectedPrice !== 'All' ? this.selectedPrice : '',
      this.activeQuickFilters.has('Special offers'),
      this.currentPage - 1,
      this.itemsPerPage,
      this.sortBy
    ).subscribe({
      next: (data: any) => {
        this.restaurants = data.content;
        this.totalPages = data.totalPages;
        this.totalElements = data.totalElements;
        this.loading = false;

        this.mapPins = this.restaurants.map((rest, index) => ({
          ...rest,
          coords: { x: 20 + (index * 15), y: 20 + (index * 10), lat: 0, lng: 0 }
        }));
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage = 'Could not fetch restaurants.';
        console.error(err);
      }
    });
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
    this.currentPage = 1;
    this.loadRestaurants();
  }

  onPriceChange(): void {
    this.currentPage = 1;
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
