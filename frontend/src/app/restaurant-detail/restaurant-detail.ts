import {Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';
import * as L from 'leaflet';

export interface MenuItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  category?: string;
  isAvailable?: boolean;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
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
  timeSlots?: any[];
  reservations?: any[];
  features?: string[];
  rating?: number;
  cuisine?: string;
  location?: string;
  price?: string;
  offer?: string;
  requiresDeposit?: boolean;
  depositAmount?: number;
  menuItems?: MenuItem[];
}

export interface ReviewItem {
  id: number;
  user?: {
    firstName: string;
    lastName: string;
  };
  rating: number;
  foodRating?: number;
  serviceRating?: number;
  ambianceRating?: number;
  comment: string;
  createdAt: string;
  author?: string;
  date?: string;
  text?: string;
  memberSince?: string;
  isHelpful?: boolean;
}

@Component({
  selector: 'app-restaurant-detail',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, Footer],
  templateUrl: './restaurant-detail.html',
  styleUrl: './restaurant-detail.css',
})
export class RestaurantDetail implements OnInit, OnDestroy {
  searchCity = 'Paris';
  searchQuery = '';
  @Input() showSearch = false;
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  activeTab: 'about' | 'menu' | 'reviews' = 'about';
  isFavorite = false;
  bookingSuccess = false;
  bookingModalOpen = false;
  selectedTimeslot: string | null = null;
  loading = true;
  error = false;

  isLoggedIn = false;
  userRole: string | null = null;
  user: any = null;

  showSuggestions = false;
  searchSuggestions: RestaurantItem[] = [];
  allRestaurants: RestaurantItem[] = [];
  private searchTimeout: any;

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  calendarDays: { day: number; isPast: boolean }[] = [];
  selectedDate: Date = new Date();
  showAllReviews = false;

  restaurant: RestaurantItem | null = null;
  reviews: ReviewItem[] = [];
  similarRestaurants: RestaurantItem[] = [];
  otherRecommendations: RestaurantItem[] = [];

  menuItems: any[] = [];
  tags: string[] = [];

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map: any;
  private marker: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadRestaurant(id);
      } else {
        this.router.navigate(['/restaurants-detail']);
      }
    });
    this.generateCalendar();
    this.checkLoginStatus();
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

  loadRestaurant(id: number): void {
    this.loading = true;
    this.error = false;

    this.api.getRestaurantById(id)
      .then((data) => {
        console.log('=== Restaurant Data ===');
        console.log('Full data:', data);

        if (data) {
          this.restaurant = this.mapToRestaurantItem(data);
          this.loadReviews(id);
          this.loadSimilarRestaurants();
          this.generateTags();
          this.loading = false;
          this.cdr.detectChanges();

          setTimeout(() => {
            this.initMap();
          }, 200);
        } else {
          this.error = true;
          this.loading = false;
          this.cdr.detectChanges();
        }
      })
      .catch((error) => {
        console.error('Error loading restaurant:', error);
        this.error = true;
        this.loading = false;
        this.cdr.detectChanges();
      });

    this.loadAllRestaurants()
  }

  loadAllRestaurants(): void {
    this.api.getRestaurants()
      .then((data) => {
        if (data && Array.isArray(data)) {
          this.allRestaurants = data.map((r: any) => this.mapToRestaurantItem(r));
        }
      })
      .catch((error) => {
        console.error('Error loading restaurants for suggestions:', error);
      });
  }

  mapToRestaurantItem(data: any): RestaurantItem {
    return {
      id: data.id,
      name: data.name || 'Unknown Restaurant',
      slug: data.slug || '',
      address: data.address || 'Address not available',
      city: data.city || 'Paris',
      cuisineType: data.cuisineType || 'Various',
      priceRange: data.priceRange || '€€',
      coverPhotoUrl: data.coverPhotoUrl || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&h=600&q=80',
      averageRating: data.averageRating || 0,
      reviewCount: data.reviewCount || 0,
      description: data.description || 'No description available.',
      specialOffer: data.specialOffer || null,
      latitude: data.latitude,
      longitude: data.longitude,
      features: data.features || [],
      gallery: data.gallery || [],
      phone: data.phone || '',
      state: data.state || '',
      zip: data.zip || '',
      rating: data.averageRating || 0,
      cuisine: data.cuisineType || 'Various',
      location: data.city || 'Paris',
      price: data.priceRange || '€€',
      offer: data.specialOffer || null,
      requiresDeposit: data.requiresDeposit || false,
      depositAmount: data.depositAmount || 0,
      menuItems: data.menuItems || [],
    };
  }

  loadReviews(restaurantId: number): void {
    console.log('=== Loading reviews for restaurant:', restaurantId, '===');

    this.api.getReviewsByRestaurant(restaurantId)
      .then((data: any) => {
        console.log('Reviews API response:', data);

        let reviewsData: any[] = [];

        if (Array.isArray(data)) {
          reviewsData = data;
        } else if (data && data.content && Array.isArray(data.content)) {
          reviewsData = data.content;
        } else if (data && data._embedded) {
          for (const key in data._embedded) {
            if (Array.isArray(data._embedded[key])) {
              reviewsData = data._embedded[key];
              break;
            }
          }
        }

        if (reviewsData && Array.isArray(reviewsData) && reviewsData.length > 0) {
          this.reviews = reviewsData.map((review: any) => ({
            id: review.id,
            rating: review.rating || 0,
            foodRating: review.foodRating || null,
            serviceRating: review.serviceRating || null,
            ambianceRating: review.ambianceRating || null,
            comment: review.comment || 'No comment provided.',
            createdAt: review.createdAt || new Date().toISOString(),
            author: review.userName || 'Anonymous',
            text: review.comment || 'No comment provided.',
            date: review.createdAt ? this.formatDate(review.createdAt) : 'Recently',
            memberSince: 'Member',
            isHelpful: false
          }));
          console.log('Mapped reviews:', this.reviews);
        } else {
          this.reviews = [];
        }
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error loading reviews:', error);
        this.reviews = [];
        this.cdr.detectChanges();
      });
  }

  loadSimilarRestaurants(): void {
    this.api.getRestaurants()
      .then((data) => {
        console.log('All restaurants for recommendations:', data);
        if (data && Array.isArray(data) && data.length > 0) {
          const filtered = data.filter((r: any) => r.id !== this.restaurant?.id);

          console.log('Filtered restaurants (excluding current):', filtered.length);

          if (filtered.length > 0) {
            const similarCuisine = filtered.filter((r: any) =>
              r.cuisineType === this.restaurant?.cuisineType
            );

            const differentCuisine = filtered.filter((r: any) =>
              r.cuisineType !== this.restaurant?.cuisineType
            );

            this.similarRestaurants = [
              ...similarCuisine.map((r: any) => this.mapToRestaurantItem(r)),
              ...differentCuisine.map((r: any) => this.mapToRestaurantItem(r))
            ].slice(0, 4);

            const usedIds = new Set(this.similarRestaurants.map(r => r.id));
            this.otherRecommendations = filtered
              .filter((r: any) => !usedIds.has(r.id))
              .slice(0, 4)
              .map((r: any) => this.mapToRestaurantItem(r));

            console.log('Similar restaurants:', this.similarRestaurants.length);
            console.log('Other recommendations:', this.otherRecommendations.length);
          } else {
            this.similarRestaurants = [];
            this.otherRecommendations = [];
          }
        } else {
          console.warn('No restaurants available for recommendations');
          this.similarRestaurants = [];
          this.otherRecommendations = [];
        }
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error loading similar restaurants:', error);
        this.similarRestaurants = [];
        this.otherRecommendations = [];
        this.cdr.detectChanges();
      });
  }

  generateCalendar(): void {
    const today = new Date();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    this.calendarDays = [];

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(this.currentYear, this.currentMonth, i);
      const isPast = date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      this.calendarDays.push({ day: i, isPast });
    }
    this.cdr.detectChanges();
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  getMonthName(): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[this.currentMonth]} ${this.currentYear}`;
  }

  generateTags(): void {
    const tags = new Set<string>();
    if (this.restaurant) {
      if (this.restaurant.cuisineType) tags.add(this.restaurant.cuisineType);
      if (this.restaurant.features) {
        this.restaurant.features.forEach(f => tags.add(f));
      }
      if (this.restaurant.city) tags.add(this.restaurant.city);
    }
    if (tags.size === 0) {
      ['French', 'European', 'Cosy', 'Good for families', 'Outdoor dining', 'Romantic'].forEach(t => tags.add(t));
    }
    this.tags = Array.from(tags);
    this.cdr.detectChanges();
  }

  onHeaderSearch(event: { city: string; query: string }): void {
    this.searchCity = event.city;
    this.searchQuery = event.query;
  }

  toggleFavorite(): void {
    this.isFavorite = !this.isFavorite;
  }

  selectTab(tab: 'about' | 'menu' | 'reviews'): void {
    this.activeTab = tab;
  }

  openBookingModal(slot: string): void {
    this.selectedTimeslot = slot;
    this.bookingModalOpen = true;
  }

  confirmBooking(): void {
    this.bookingSuccess = true;
    setTimeout(() => {
      this.bookingModalOpen = false;
      this.bookingSuccess = false;
      this.cdr.detectChanges();
    }, 2500);
  }

  closeBookingModal(): void {
    this.bookingModalOpen = false;
    this.bookingSuccess = false;
    this.cdr.detectChanges();
  }

  toggleReviewHelpful(review: ReviewItem): void {
  }

  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }

  scrollCarousel(elementId: string, offset: number): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  scrollToSection(sectionId: string): void {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.classList.remove('border-black', 'text-gray-900');
      tab.classList.add('border-transparent', 'text-gray-500');
    });

    const activeTab = document.getElementById('tab-' + sectionId);
    if (activeTab) {
      activeTab.classList.remove('border-transparent', 'text-gray-500');
      activeTab.classList.add('border-black', 'text-gray-900');
    }

    const element = document.getElementById(sectionId);
    if (element) {
      const yOffset = -110;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
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
    this.showSuggestions = false;

    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: restaurant.city || 'Paris',
        q: restaurant.name,
      },
    });
  }

  onSearch(): void {
    this.showSuggestions = false;
    this.searchSuggestions = [];

    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: this.searchCity || 'Paris',
        q: this.searchQuery || undefined,
      },
    });
  }

  onSearchBlur(): void {
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  get averageFoodRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const total = this.reviews.reduce((sum, r) => sum + (r.foodRating || 0), 0);
    return total / this.reviews.length;
  }

  get averageServiceRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const total = this.reviews.reduce((sum, r) => sum + (r.serviceRating || 0), 0);
    return total / this.reviews.length;
  }

  get averageAmbianceRating(): number {
    if (!this.reviews || this.reviews.length === 0) return 0;
    const total = this.reviews.reduce((sum, r) => sum + (r.ambianceRating || 0), 0);
    return total / this.reviews.length;
  }

  getFoodRatingPercentage(): number {
    const max = 10;
    return (this.averageFoodRating / max) * 100;
  }

  getServiceRatingPercentage(): number {
    const max = 10;
    return (this.averageServiceRating / max) * 100;
  }

  getAmbianceRatingPercentage(): number {
    const max = 10;
    return (this.averageAmbianceRating / max) * 100;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'Recently';
    try {
      let date: Date;
      if (typeof dateString === 'string') {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          const cleanDate = dateString.replace(/\.\d+/, '');
          date = new Date(cleanDate);
          if (isNaN(date.getTime())) {
            return 'Recently';
          }
        }
      } else {
        return 'Recently';
      }

      const now = new Date();
      const diffTime = Math.abs(now.getTime() - date.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
      return `${Math.floor(diffDays / 365)} years ago`;
    } catch {
      return 'Recently';
    }
  }

  getMenuCategories(): string[] {
    if (!this.restaurant?.menuItems) return [];
    const categories = new Set<string>();
    this.restaurant.menuItems.forEach(item => {
      if (item.category) categories.add(item.category);
    });
    return Array.from(categories);
  }

  getMenuItemsByCategory(category: string): MenuItem[] {
    if (!this.restaurant?.menuItems) return [];
    return this.restaurant.menuItems.filter(item => item.category === category);
  }

  private initMap(): void {
    if (!this.mapContainer || !this.restaurant) return;

    const lat = this.restaurant.latitude || 48.8566;
    const lng = this.restaurant.longitude || 2.3522;

    this.map = L.map(this.mapContainer.nativeElement, {
      center: [lat, lng],
      zoom: 15,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    const customIcon = L.divIcon({
      className: 'custom-map-marker',
      html: `
      <div class="flex items-center justify-center w-10 h-10 bg-[#005943] rounded-full shadow-lg border-2 border-white">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
        </svg>
      </div>
    `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    });

    this.marker = L.marker([lat, lng], { icon: customIcon })
      .addTo(this.map)
      .bindPopup(`
      <div class="text-center">
        <p class="font-bold text-sm">${this.restaurant?.name || 'Restaurant'}</p>
        <p class="text-xs text-gray-600">${this.restaurant?.address || ''}</p>
      </div>
    `);

    setTimeout(() => {
      if (this.map) {
        this.map.invalidateSize();
      }
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
  }

}
