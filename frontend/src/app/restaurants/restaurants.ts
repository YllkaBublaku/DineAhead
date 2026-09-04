import {Component, EventEmitter, Input, OnInit, Output, ViewChild, ElementRef, ChangeDetectorRef} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import {ApiService} from '../services/api.service';
import * as L from 'leaflet';
import {FavoritesService} from '../services/favorites.service';
import { TimeFormatPipe } from '../pipes/time-format.pipe';

export interface TimeSlot {
  slotTime?: string;
  slotDate?: string;
  maxCapacity?: number;
  isActive?: boolean;
}

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
  timeSlots?: TimeSlot[];
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

export interface BookingRequest {
  restaurantId: number;
  date: string;
  time: string;
  guests: number;
  specialRequests?: string;
  depositAmount?: number;
}

@Component({
  selector: 'app-restaurants',
  imports: [RouterLink, CommonModule, FormsModule, Footer, TimeFormatPipe],
  templateUrl: './restaurants.html',
  styleUrl: './restaurants.css',
})
export class Restaurants implements OnInit {
  searchCity = 'Paris';
  searchQuery = '';
  currentPage = 1;
  itemsPerPage = 10;
  @Input() showSearch = false;
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  selectedDate = this.formatDate(new Date());
  selectedTime = '19:00';
  selectedGuests = 2;

  selectedBookingDate: Date | null = null;
  selectedBookingTime: string | null = null;
  selectedBookingGuests: number = 2;
  modalSelectedTime: string | null = null;
  modalSelectedDate: Date | null = null;

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
  loading = false;
  errorMessage = '';
  totalElements = 0;
  totalPages = 0;

  mobileMenuOpen = false;
  mobileMapOpen = false;
  allFiltersModalOpen = false;
  bookingModalOpen = false;
  selectedRestaurant: RestaurantItem | null = null;
  selectedTimeslot: TimeSlot | null = null;
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

  showSuggestions = false;
  searchSuggestions: RestaurantItem[] = [];

  bookingLoading = false;
  bookingError = '';
  paymentModalOpen = false;
  bookingForm = {
    specialRequests: '',
    paymentMethod: 'card'
  };
  isPaymentRequired = false;
  bookingDepositAmount = 0;

  @ViewChild('mapContainer', {static: false}) mapContainer!: ElementRef;
  private map: any;
  private markersLayer: any = L.layerGroup();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.checkLoginStatus();

    this.favoritesService.favorites$.subscribe(() => {
      this.cdr.detectChanges();
    })

    this.route.queryParams.subscribe(params => {
      if (params['q']) {
        this.searchQuery = params['q'];
      }
      if (params['city']) {
        this.searchCity = params['city'];
      }
      this.loadRestaurants();
    });

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

        this.allRestaurants = Array.isArray(data) ? data : [];

        this.route.queryParams.subscribe(params => {
          if (params['q']) {
            this.searchQuery = params['q'];
          }
          if (params['city']) {
            this.searchCity = params['city'];
          }
          this.extractFilterOptions();
          this.applyFilters();
          this.loading = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.renderMapMarkers();
            if (this.map) {
              this.map.invalidateSize();
            }
          }, 100);
        }).unsubscribe();
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
    console.log('Initial restaurants count:', filtered.length);

    if (this.selectedBookingDate && this.selectedBookingTime) {
      const year = this.selectedBookingDate.getFullYear();
      const month = String(this.selectedBookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.selectedBookingDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${year}-${month}-${day}`;

      filtered = filtered.filter(rest => {
        if (rest.timeSlots && rest.timeSlots.length > 0) {

          const hasMatch = rest.timeSlots.some(slot => {
            if (slot.isActive === false) return false;

            const slotTime = slot.slotTime as string;
            if (!slotTime) return false;

            const timeStr = slotTime.substring(0, 5);
            const selectedTimeStr = this.selectedBookingTime;

            const timeMatch = timeStr === selectedTimeStr;
            const guestsMatch = !slot.maxCapacity || (this.selectedBookingGuests || 2) <= slot.maxCapacity;
            const dateMatch = slot.slotDate === selectedDateStr;

            return timeMatch && guestsMatch && dateMatch;
          });
          return hasMatch;
        }
        return true;
      });
    }

    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(rest =>
        rest.name?.toLowerCase().includes(query) ||
        rest.cuisineType?.toLowerCase().includes(query) ||
        rest.description?.toLowerCase().includes(query) ||
        rest.address?.toLowerCase().includes(query)
      );
      console.log('After search query filter:', filtered.length);
    }

    if (this.searchCity && this.searchCity !== 'Paris') {
      const city = this.searchCity.toLowerCase().trim();
      filtered = filtered.filter(rest =>
        rest.city?.toLowerCase().includes(city) ||
        rest.address?.toLowerCase().includes(city)
      );
      console.log('After search city filter:', filtered.length);
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

    if (this.selectedNeighborhood !== 'All') {
      filtered = filtered.filter(rest =>
        rest.city === this.selectedNeighborhood
      );
    } else if (this.filters.neighborhood.length > 0) {
      filtered = filtered.filter(rest =>
        this.filters.neighborhood.includes(rest.city)
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

    this.cdr.detectChanges();

    setTimeout(() => {
      this.renderMapMarkers();
    }, 50);
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

    this.selectedBookingDate = date;
    this.applyFilters();
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

    this.selectedBookingTime = time;
    this.applyFilters();
  }

  selectGuests(count: number): void {
    this.selectedGuests = count;
    this.guestsModalOpen = false;

    this.selectedBookingGuests = count;
    this.applyFilters();
  }

  resetBookingFilters(): void {
    this.selectedBookingDate = null;
    this.selectedBookingTime = null;
    this.selectedBookingGuests = 2;

    this.selectedDate = this.formatDate(new Date());
    this.selectedTime = '19:00';
    this.selectedGuests = 2;

    this.selectedDay = new Date().getDate();
    this.currentMonth = new Date().getMonth();
    this.currentYear = new Date().getFullYear();

    this.applyFilters();
    this.cdr.detectChanges();
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
    if (this.selectedBookingDate && this.selectedBookingTime) {
      const year = this.selectedBookingDate.getFullYear();
      const month = String(this.selectedBookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.selectedBookingDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${year}-${month}-${day}`;

      if (restaurant.timeSlots && restaurant.timeSlots.length > 0) {
        return restaurant.timeSlots.some(slot => {
          const slotTime = slot.slotTime as string;
          if (!slotTime) return false;

          const timeStr = slotTime.substring(0, 5);
          const selectedTimeStr = this.selectedBookingTime;

          const timeMatch = timeStr === selectedTimeStr;
          const guestsMatch = !slot.maxCapacity || (this.selectedBookingGuests || 2) <= slot.maxCapacity;
          const isActive = slot.isActive !== false;
          const dateMatch = slot.slotDate === selectedDateStr;

          return timeMatch && guestsMatch && isActive && dateMatch;
        });
      }
      return true;
    }

    if (restaurant.timeSlots && restaurant.timeSlots.length > 0) {
      return restaurant.timeSlots.some(slot => {
        return slot.isActive !== false;
      });
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
    this.clearAllFilters();
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

    this.selectedBookingDate = null;
    this.selectedBookingTime = null;
    this.selectedBookingGuests = 2;
    this.selectedDate = this.formatDate(new Date());
    this.selectedTime = '19:00';
    this.selectedGuests = 2;
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

    if (!this.restaurants || this.restaurants.length === 0) {
      console.log('No restaurants to display on map');
      return;
    }

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
    } else {
      this.map.setView([48.8566, 2.3522], 12);
    }
  }

  refreshMapMarkers(): void {
    if (!this.map) return;

    this.markersLayer.clearLayers();

    if (!this.restaurants || this.restaurants.length === 0) {
      console.log('No restaurants to refresh on map');
      return;
    }

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

  onSearchInput(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.showSuggestions = true;

    this.searchTimeout = setTimeout(() => {
      if (this.searchQuery && this.searchQuery.trim().length > 0) {
        const query = this.searchQuery.toLowerCase().trim();

        const allRestaurants = [...this.allRestaurants];

        this.searchSuggestions = allRestaurants.filter(rest =>
          rest.name?.toLowerCase().includes(query) ||
          rest.cuisineType?.toLowerCase().includes(query) ||
          rest.city?.toLowerCase().includes(query)
        ).slice(0, 5);
      } else {
        this.searchSuggestions = [];
      }
    }, 300);
  }

  selectSuggestion(restaurant: RestaurantItem): void {
    this.searchQuery = restaurant.name;
    this.searchCity = restaurant.city || 'Paris';
    this.showSuggestions = false;

    this.currentPage = 1;
    this.applyFilters();

    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: this.searchCity || 'Paris',
        q: this.searchQuery || undefined,
      },
      replaceUrl: true
    });
  }

  onSearch(): void {
    this.showSuggestions = false;
    this.searchSuggestions = [];
    this.currentPage = 1;
    this.applyFilters();

    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: this.searchCity || 'Paris',
        q: this.searchQuery || undefined,
      },
      replaceUrl: true
    });
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
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

    const restaurant = this.allRestaurants.find(r => r.id === id);
    if (restaurant) {
      this.favoritesService.toggleFavorite({
        id: restaurant.id,
        name: restaurant.name,
        coverPhotoUrl: restaurant.coverPhotoUrl || '',
        cuisineType: restaurant.cuisineType || '',
        priceRange: restaurant.priceRange || '',
        averageRating: restaurant.averageRating || 0,
        reviewCount: restaurant.reviewCount || 0,
        address: restaurant.address || '',
        city: restaurant.city || ''
      });
    }
  }

  isFavorite(id: number): boolean {
    return this.favoritesService.isFavorite(id);
  }

  async openBookingModal(rest: RestaurantItem, slot: TimeSlot, event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    const slotTime = (slot.slotTime as string).substring(0, 5);

    this.modalSelectedTime = slotTime;

    if (slot.slotDate) {
      const dateParts = slot.slotDate.split('-');
      if (dateParts.length === 3) {
        this.modalSelectedDate = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2])
        );
      }
    } else if (!this.selectedBookingDate) {
      this.modalSelectedDate = new Date();
    }

    this.selectedBookingTime = slotTime;
    this.selectedTime = slotTime;

    if (this.modalSelectedDate) {
      this.selectedBookingDate = this.modalSelectedDate;
      this.selectedDate = this.formatDate(this.modalSelectedDate);
      this.selectedDay = this.modalSelectedDate.getDate();
      this.currentMonth = this.modalSelectedDate.getMonth();
      this.currentYear = this.modalSelectedDate.getFullYear();
    }

    if (!this.selectedBookingGuests) {
      this.selectedBookingGuests = 2;
      this.selectedGuests = 2;
    }

    this.selectedRestaurant = rest;
    this.selectedTimeslot = slot;
    this.bookingModalOpen = true;
    this.bookingSuccess = false;
    this.bookingError = '';

    this.applyFilters();

    try {
      const depositInfo = await this.api.getRestaurantDeposit(rest.id);
      if (depositInfo && depositInfo.requiresDeposit) {
        this.isPaymentRequired = true;
        this.bookingDepositAmount = depositInfo.amount || 0;
      } else {
        this.isPaymentRequired = false;
        this.bookingDepositAmount = 0;
      }
    } catch (error) {
      this.isPaymentRequired = false;
      this.bookingDepositAmount = 0;
    }
  }

  async confirmBooking(): Promise<void> {
    if (!this.selectedRestaurant || !this.selectedTimeslot) return;

    this.bookingLoading = true;
    this.bookingError = '';

    try {
      const depositInfo = await this.api.getRestaurantDeposit(this.selectedRestaurant.id);

      if (depositInfo && depositInfo.requiresDeposit && depositInfo.amount > 0) {
        this.isPaymentRequired = true;
        this.bookingDepositAmount = depositInfo.amount;
        this.bookingLoading = false;
        this.paymentModalOpen = true;
        return;
      }

      await this.createBooking();
      this.bookingSuccess = true;
      setTimeout(() => {
        this.bookingModalOpen = false;
        this.bookingSuccess = false;
        this.resetBookingState();
      }, 2500);

    } catch (error) {
      console.error('Booking failed:', error);
      this.bookingError = 'Failed to book reservation. Please try again.';
      this.bookingLoading = false;
    }
  }

  async processPayment(): Promise<void> {
    if (!this.selectedRestaurant || !this.selectedTimeslot) return;

    this.bookingLoading = true;
    this.bookingError = '';

    try {
      const paymentResult = await this.api.processPayment({
        restaurantId: this.selectedRestaurant.id,
        amount: this.bookingDepositAmount,
        method: this.bookingForm.paymentMethod as 'card' | 'paypal' | 'cash',
        bookingData: {
          date: this.selectedTimeslot.slotDate,
          time: this.selectedTimeslot.slotTime,
          guests: this.selectedBookingGuests,
          specialRequests: this.bookingForm.specialRequests
        }
      });

      if (paymentResult.success) {
        await this.createBooking();
        this.bookingSuccess = true;
        this.paymentModalOpen = false;
        setTimeout(() => {
          this.bookingModalOpen = false;
          this.bookingSuccess = false;
          this.resetBookingState();
        }, 2500);
      } else {
        this.bookingError = 'Payment failed. Please try again.';
      }
    } catch (error) {
      console.error('Payment failed:', error);
      this.bookingError = 'Payment processing failed. Please try again.';
    } finally {
      this.bookingLoading = false;
    }
  }

  async createBooking(): Promise<void> {
    if (!this.selectedRestaurant || !this.selectedTimeslot) return;

    try {
      await this.api.createReservation({
        restaurantId: this.selectedRestaurant.id,
        date: this.selectedTimeslot.slotDate,
        time: this.selectedTimeslot.slotTime,
        guests: this.selectedBookingGuests,
        specialRequests: this.bookingForm.specialRequests || '',
        status: 'confirmed',
        depositPaid: this.isPaymentRequired,
        depositAmount: this.bookingDepositAmount
      });
    } catch (error) {
      console.error('Failed to create booking:', error);
      throw error;
    }
  }

  resetBookingState(): void {
    this.selectedRestaurant = null;
    this.selectedTimeslot = null;
    this.bookingForm = {
      specialRequests: '',
      paymentMethod: 'card'
    };
    this.isPaymentRequired = false;
    this.bookingDepositAmount = 0;
    this.bookingError = '';
  }

  getAvailableTimeSlots(restaurant: RestaurantItem): TimeSlot[] {
    if (!restaurant.timeSlots) return [];

    const selectedDate = this.selectedBookingDate;
    const guests = this.selectedBookingGuests || 2;

    let targetDate = selectedDate;
    if (!targetDate) {
      targetDate = new Date();
    }

    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slotsForDate = restaurant.timeSlots.filter(slot => {
      if (slot.isActive === false) return false;
      if (slot.slotDate !== dateStr) return false;
      if (slot.maxCapacity && guests > slot.maxCapacity) return false;
      return true;
    });

    let filteredSlots = slotsForDate;
    if (this.bookingModalOpen && this.modalSelectedTime) {
      filteredSlots = filteredSlots.filter(slot => {
        const slotTime = (slot.slotTime as string).substring(0, 5);
        return slotTime === this.modalSelectedTime;
      });
    }

    const seenTimes = new Set<string>();
    const uniqueSlots = filteredSlots.filter(slot => {
      const time = (slot.slotTime as string).substring(0, 5);
      if (seenTimes.has(time)) {
        return false;
      }
      seenTimes.add(time);
      return true;
    });

    return uniqueSlots.sort((a, b) => {
      const timeA = (a.slotTime as string).substring(0, 5);
      const timeB = (b.slotTime as string).substring(0, 5);
      return timeA.localeCompare(timeB);
    });
  }

  async isRestaurantRequiresDeposit(restaurant: RestaurantItem): Promise<boolean> {
    try {
      const depositInfo = await this.api.getRestaurantDeposit(restaurant.id);
      return depositInfo && depositInfo.requiresDeposit;
    } catch (error) {
      return false;
    }
  }

  async getDepositAmount(restaurant: RestaurantItem): Promise<number> {
    try {
      const depositInfo = await this.api.getRestaurantDeposit(restaurant.id);
      return depositInfo && depositInfo.amount ? depositInfo.amount : 0;
    } catch (error) {
      return 0;
    }
  }

  isRestaurantExpensive(restaurant: RestaurantItem): boolean {
    const priceValue = this.getPriceValue(restaurant.priceRange);
    return priceValue >= 100; // €€€ or above
  }


  closeBookingModal(): void {
    this.bookingModalOpen = false;
    this.selectedTimeslot = null;

    this.modalSelectedTime = null;
    this.modalSelectedDate = null;
    this.selectedBookingTime = null;
    this.selectedTime = '19:00';

    if (this.selectedBookingDate) {}

    this.applyFilters();
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
