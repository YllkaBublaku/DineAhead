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
  latitude?: number;
  longitude?: number;
  state?: string;
  zip?: string;
  phone?: string;
  timeSlots?: any[];
  reservations?: any[];
  features?: string[];
}

export interface FilterState {
  cuisine: string[];
  priceRange: { min: number; max: number };
  setting: string[];
  neighborhood: string[];
  specialOffers: boolean;
  bestRated: boolean;
  availableNow: boolean;
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
  itemsPerPage = 3;
  @Input() showSearch = false;
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  selectedDate = this.formatDate(new Date());
  selectedTime = '19:00';
  selectedGuests = 2;

  dateModalOpen = false;
  timeModalOpen = false;
  guestsModalOpen = false;

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDay = new Date().getDate();

  private searchTimeout: any;
  timeSlots: string[] = [];

  filters: FilterState = {
    cuisine: [],
    priceRange: {min: 0, max: 150},
    setting: [],
    neighborhood: [],
    specialOffers: false,
    bestRated: false,
    availableNow: false
  };

  activeQuickFilters = new Set<string>();
  selectedCuisine = 'All';
  selectedPrice = 'All';
  selectedNeighborhood = 'All';
  sortBy = 'averageRating';

  allRestaurants: RestaurantItem[] = [];
  filteredRestaurants: RestaurantItem[] = [];
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

  selectedSetting = '';
  availableCuisines: string[] = [];
  availableCities: string[] = [];
  availableSettings: string[] = ['With friends', 'Good for families', 'Outdoor dining', 'Traditional'];
  availablePriceRanges: string[] = ['€€', '€€€', '€€€€'];

  @ViewChild('mapContainer', {static: false}) mapContainer!: ElementRef;
  private map: any;
  private markersLayer: any = L.layerGroup();

  constructor(private route: ActivatedRoute, private router: Router, private api: ApiService) {
  }

  ngOnInit(): void {
    this.checkLoginStatus();
    this.loadRestaurants();
    this.generateTimeSlots();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 100);
  }

  private initMap(): void {
    if (!this.mapContainer) return;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [48.8566, 2.3522],
      zoom: 12,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);

    setTimeout(() => {
      this.map.invalidateSize();
    }, 200);
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

    this.api.getFeatures()
      .then((features) => {
        this.availableSettings = features || [];
        return this.api.getRestaurants();
      })
      .then((data) => {
        console.log('API Response:', data);
        console.log('Is array?', Array.isArray(data));
        console.log('Type:', typeof data);

        this.allRestaurants = Array.isArray(data) ? data : [];
        this.extractFilterOptions();
        this.applyFilters();
        this.loading = false;
        setTimeout(() => {
          this.renderMapMarkers();
          if (this.map) {
            this.map.invalidateSize();
          }
        }, 100);
      })
      .catch((error) => {
        console.error("Failed to fetch:", error);
        this.loading = false;
        this.allRestaurants = [];
        this.availableSettings = ['With friends', 'Good for families', 'Outdoor dining', 'Traditional'];
      });
  }

  extractFilterOptions(): void {
    const cuisines = new Set<string>();
    const cities = new Set<string>();

    if (!Array.isArray(this.allRestaurants)) {
      console.warn('allRestaurants is not an array:', this.allRestaurants);
      this.allRestaurants = [];
      return;
    }

    this.allRestaurants.forEach(rest => {
      if (rest.cuisineType) cuisines.add(rest.cuisineType);
      if (rest.city) cities.add(rest.city);
    });

    this.availableCuisines = Array.from(cuisines).sort();
    this.availableCities = Array.from(cities).sort();
  }

  applyFilters(): void {

    if (!Array.isArray(this.allRestaurants)) {
      console.warn('allRestaurants is not an array in applyFilters');
      this.allRestaurants = [];
    }

    let filtered = [...this.allRestaurants];

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(rest =>
        rest.name?.toLowerCase().includes(query) ||
        rest.cuisineType?.toLowerCase().includes(query) ||
        rest.description?.toLowerCase().includes(query) ||
        rest.address?.toLowerCase().includes(query)
      );
    }

    if (this.searchCity && this.searchCity !== 'Paris') {
      const city = this.searchCity.toLowerCase().trim();
      filtered = filtered.filter(rest =>
        rest.city?.toLowerCase().includes(city) ||
        rest.address?.toLowerCase().includes(city)
      );
    }

    if (this.filters.cuisine.length > 0) {
      filtered = filtered.filter(rest =>
        this.filters.cuisine.includes(rest.cuisineType)
      );
    } else if (this.selectedCuisine !== 'All') {
      filtered = filtered.filter(rest =>
        rest.cuisineType === this.selectedCuisine
      );
    }

    if (this.filters.priceRange.min > 0 || this.filters.priceRange.max < 150) {
      filtered = filtered.filter(rest => {
        const price = this.getPriceValue(rest.priceRange);
        return price >= this.filters.priceRange.min && price <= this.filters.priceRange.max;
      });
    } else if (this.selectedPrice !== 'All') {
      filtered = filtered.filter(rest =>
        rest.priceRange === this.selectedPrice
      );
    }

    if (this.filters.neighborhood.length > 0) {
      filtered = filtered.filter(rest =>
        this.filters.neighborhood.includes(rest.city)
      );
    } else if (this.selectedNeighborhood !== 'All') {
      filtered = filtered.filter(rest =>
        rest.city === this.selectedNeighborhood
      );
    }

    if (this.filters.setting.length > 0) {
      filtered = filtered.filter(rest => {
        if (!rest.features || rest.features.length === 0) return false;
        return this.filters.setting.every(setting =>
          rest.features?.includes(setting)
        );
      });
    }

    if (this.selectedSetting && this.selectedSetting !== '') {
      if (!this.filters.setting.includes(this.selectedSetting)) {
        filtered = filtered.filter(rest =>
          rest.features?.includes(this.selectedSetting)
        );
      }
    }

    if (this.selectedNeighborhood !== 'All') {
      filtered = filtered.filter(rest =>
        rest.city === this.selectedNeighborhood
      );
    }

    if (this.activeQuickFilters.has('Special offers')) {
      filtered = filtered.filter(rest => rest.specialOffer);
    }

    if (this.activeQuickFilters.has('Available now')) {
      filtered = filtered.filter(rest => this.isRestaurantAvailable(rest));
    }

    if (this.activeQuickFilters.has('Best rated')) {
      filtered = filtered.filter(rest => (rest.averageRating || 0) >= 4.5);
    }

    this.applySorting(filtered);

    this.filteredRestaurants = filtered;
    this.totalElements = filtered.length;
    this.totalPages = Math.ceil(this.totalElements / this.itemsPerPage);

    if (this.currentPage > this.totalPages) {
      this.currentPage = Math.max(1, this.totalPages);
    }

    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = Math.min(startIndex + this.itemsPerPage, this.totalElements);
    this.restaurants = filtered.slice(startIndex, endIndex);
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = {month: 'short', day: 'numeric'};
    return date.toLocaleDateString('en-US', options);
  }

  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        this.timeSlots.push(`${h}:${m}`);
      }
    }
  }

  getDaysInMonth(month: number, year: number): number[] {
    const days = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }

  getFirstDayOfMonth(month: number, year: number): number {
    return new Date(year, month, 1).getDay();
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectDate(day: number): void {
    this.selectedDay = day;
    const date = new Date(this.currentYear, this.currentMonth, day);
    this.selectedDate = this.formatDate(date);
    this.dateModalOpen = false;
  }

  isDateInPast(day: number, month: number, year: number): boolean {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  isTimeInPast(time: string): boolean {
    const today = new Date();
    const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);
    const todayDate = new Date();

    if (selectedDate > todayDate) {
      return false;
    }

    if (selectedDate.toDateString() === todayDate.toDateString()) {
      const [hours, minutes] = time.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      return selectedTime < todayDate;
    }
    return true;
  }

  selectTime(time: string): void {
    this.selectedTime = time;
    this.timeModalOpen = false;
  }

  selectGuests(count: number): void {
    this.selectedGuests = count;
    this.guestsModalOpen = false;
  }

  getPriceValue(priceRange: string): number {
    const map: { [key: string]: number } = {
      '€': 25,
      '€€': 50,
      '€€€': 100,
      '€€€€': 150
    };
    return map[priceRange] || 50;
  }

  isRestaurantAvailable(restaurant: RestaurantItem): boolean {
    if (restaurant.timeSlots && restaurant.timeSlots.length > 0) {
      const today = new Date().toDateString();
      const hasAvailableSlot = restaurant.timeSlots.some(slot => {
        return slot.available !== false;
      });
      return hasAvailableSlot;
    }
    return true;
  }

  applySorting(restaurants: RestaurantItem[]): void {
    switch (this.sortBy) {
      case 'averageRating':
        restaurants.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name':
        restaurants.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'reviewCount':
        restaurants.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        break;
    }
  }

  openFiltersModal(): void {
    this.allFiltersModalOpen = true;
  }

  closeFiltersModal(): void {
    this.allFiltersModalOpen = false;
  }

  clearAllFilters(): void {
    this.filters = {
      cuisine: [],
      priceRange: {min: 0, max: 150},
      setting: [],
      neighborhood: [],
      specialOffers: false,
      bestRated: false,
      availableNow: false
    };
    this.activeQuickFilters.clear();
    this.selectedCuisine = 'All';
    this.selectedPrice = 'All';
    this.selectedNeighborhood = 'All';
    this.selectedSetting = '';
    this.searchQuery = '';
    this.searchCity = 'Paris';
    this.currentPage = 1;
    this.applyFilters();
    this.closeFiltersModal();
  }

  toggleCuisineFilter(cuisine: string): void {
    const index = this.filters.cuisine.indexOf(cuisine);
    if (index > -1) {
      this.filters.cuisine.splice(index, 1);
      if (this.selectedCuisine === cuisine) {
        this.selectedCuisine = 'All';
      }
    } else {
      this.filters.cuisine.push(cuisine);
      this.selectedCuisine = cuisine;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleSettingFilter(setting: string): void {
    const index = this.filters.setting.indexOf(setting);
    if (index > -1) {
      this.filters.setting.splice(index, 1);
      if (this.selectedSetting === setting) {
        this.selectedSetting = '';
      }
    } else {
      this.filters.setting.push(setting);
      this.selectedSetting = setting;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  toggleNeighborhoodFilter(neighborhood: string): void {
    const index = this.filters.neighborhood.indexOf(neighborhood);
    if (index > -1) {
      this.filters.neighborhood.splice(index, 1);
      if (this.selectedNeighborhood === neighborhood) {
        this.selectedNeighborhood = 'All';
      }
    } else {
      this.filters.neighborhood.push(neighborhood);
      this.selectedNeighborhood = neighborhood;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onSettingChange(): void {
    if (this.selectedSetting && this.selectedSetting !== '') {
      if (!this.filters.setting.includes(this.selectedSetting)) {
        this.filters.setting.push(this.selectedSetting);
      }
    } else {
      this.filters.setting = [];
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  getActiveFilterCount(): number {
    let count = 0;
    if (this.filters.cuisine.length > 0) count++;
    if (this.filters.neighborhood.length > 0) count++;
    if (this.filters.setting.length > 0) count++;
    if (this.filters.priceRange.min > 0 || this.filters.priceRange.max < 150) count++;
    if (this.filters.specialOffers) count++;
    if (this.filters.availableNow) count++;
    if (this.filters.bestRated) count++;
    if (this.searchQuery && this.searchQuery.trim() !== '') count++;
    if (this.searchCity && this.searchCity !== 'Paris') count++;
    if (this.selectedSetting && this.selectedSetting !== '') count++;
    if (this.selectedCuisine !== 'All') count++;
    if (this.selectedNeighborhood !== 'All') count++;
    if (this.selectedPrice !== 'All') count++;
    return count;
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

        const marker = L.marker([restaurant.latitude, restaurant.longitude], {icon: myIcon})
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
      this.map.fitBounds(bounds, {padding: [50, 50]});
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

        const marker = L.marker([restaurant.latitude, restaurant.longitude], {icon: myIcon})
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
    this.applyFilters();
  }

  scrollToTop(): void {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  }

  goToPage(page: number | string): void {
    if (typeof page === 'number') {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.applyFilters();
      this.scrollToTop();
    }
  }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchTimeout = setTimeout(() => {
      this.currentPage = 1;
      this.applyFilters();
    }, 300);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFilters();
      this.scrollToTop();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFilters();
      this.scrollToTop();
    }
  }

  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;

    pages.push(1);

    if (total <= 7) {
      for (let i = 2; i <= total; i++) {
        pages.push(i);
      }
      return pages;
    }

    if (current <= 3) {
      pages.push(2, 3, 4);
      pages.push('...');
      pages.push(total);
    } else if (current >= total - 2) {
      pages.push('...');
      for (let i = total - 3; i <= total; i++) {
        pages.push(i);
      }
    } else {
      pages.push('...');
      pages.push(current - 1);
      pages.push(current);
      pages.push(current + 1);
      pages.push('...');
      pages.push(total);
    }
    return pages;
  }

  toggleQuickFilter(filterName: string): void {
    const filterMap: { [key: string]: keyof FilterState } = {
      'Special offers': 'specialOffers',
      'Available now': 'availableNow',
      'Best rated': 'bestRated'
    };

    const filterKey = filterMap[filterName];
    if (filterKey) {
      const currentValue = this.filters[filterKey];
      if (typeof currentValue === 'boolean') {
        this.filters[filterKey] = !currentValue as any;
      }
    }

    if (this.activeQuickFilters.has(filterName)) {
      this.activeQuickFilters.delete(filterName);
    } else {
      this.activeQuickFilters.add(filterName);
    }

    this.currentPage = 1;
    this.applyFilters();
  }

  isQuickFilterActive(filterName: string): boolean {
    return this.activeQuickFilters.has(filterName);
  }

  onCuisineChange(): void {
    if (this.selectedCuisine !== 'All') {
      if (!this.filters.cuisine.includes(this.selectedCuisine)) {
        this.filters.cuisine.push(this.selectedCuisine);
      }
    } else {
      this.filters.cuisine = [];
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onPriceChange(): void {
    if (this.selectedPrice !== 'All') {
      const priceMap: { [key: string]: { min: number; max: number } } = {
        '€€': {min: 25, max: 50},
        '€€€': {min: 50, max: 100},
        '€€€€': {min: 100, max: 150}
      };
      const range = priceMap[this.selectedPrice];
      if (range) {
        this.filters.priceRange.min = range.min;
        this.filters.priceRange.max = range.max;
      }
    } else {
      this.filters.priceRange.min = 0;
      this.filters.priceRange.max = 150;
    }
    this.currentPage = 1;
    this.applyFilters();
  }

  onNeighborhoodChange(): void {
    if (this.selectedNeighborhood !== 'All') {
      if (!this.filters.neighborhood.includes(this.selectedNeighborhood)) {
        this.filters.neighborhood.push(this.selectedNeighborhood);
      }
    } else {
      this.filters.neighborhood = [];
    }
    this.currentPage = 1;
    this.applyFilters();
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
    if (el) el.scrollBy({left: offset, behavior: 'smooth'});
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


  getActiveCity(): string {
    if (this.selectedNeighborhood && this.selectedNeighborhood !== 'All') {
      return this.selectedNeighborhood;
    }

    if (this.filters.neighborhood && this.filters.neighborhood.length > 0) {
      return this.filters.neighborhood[0];
    }

    if (this.searchCity && this.searchCity !== 'Paris') {
      return this.searchCity;
    }
    return 'Paris';
  }

  getActiveSearchTerm(): string {
    return this.searchQuery?.trim() || '';
  }

  getPageTitle(): string {
    const city = this.getActiveCity();
    const searchTerm = this.getActiveSearchTerm();

    if (this.totalElements === 0) {
      if (city && city !== 'Paris') {
        return `No Restaurants Found in ${city}`;
      }
      if (searchTerm) {
        return `No Restaurants Found for "${searchTerm}"`;
      }
      return 'No Restaurants Found';
    }

    if (city && city !== 'Paris') {
      return `The Best Restaurants in ${city}`;
    }

    if (searchTerm) {
      return `Restaurants matching "${searchTerm}"`;
    }

    if (this.totalElements < 10) {
      return `The Best Restaurants in Paris`;
    }

    return 'The 10 Best Restaurants in Paris';
  }

  getPageDescription(): string {
    const city = this.getActiveCity();
    const searchTerm = this.getActiveSearchTerm();

    if (this.totalElements === 0) {
      if (city && city !== 'Paris') {
        return `We couldn't find any restaurants in ${city}. Try searching for a different city or neighborhood, or adjust your filters.`;
      }
      if (searchTerm) {
        return `We couldn't find any restaurants matching "${searchTerm}". Try adjusting your search terms or explore our full list of restaurants.`;
      }
      return 'No restaurants found matching your criteria. Try adjusting your filters.';
    }

    if (city && city !== 'Paris') {
      return `Discover the best dining experiences in ${city}. From cozy bistros to fine dining establishments, find the perfect restaurant for any occasion with easy instant online booking.`;
    }

    if (searchTerm) {
      return `Showing ${this.totalElements} restaurant${this.totalElements > 1 ? 's' : ''} that match "${searchTerm}". Discover the best dining experiences with easy instant online booking.`;
    }

    return `Discover ${this.totalElements} exceptional restaurants in Paris, where centuries-old bistros and three-Michelin-starred temples sit side by side. Stroll arrondissement by arrondissement to discover cozy wine bars, innovative neo-bistros, and unforgettable culinary heritage with easy instant online booking.`;
  }
}
