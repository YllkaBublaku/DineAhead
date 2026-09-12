import {Component, EventEmitter, Input, OnInit, Output, OnDestroy, ChangeDetectorRef, ElementRef, ViewChild } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';
import * as L from 'leaflet';
import {FavoritesService} from '../services/favorites.service';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import {environment} from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

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
  helpfulCount?: number;
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
  calendarDays: { day: number; isPast: boolean, hasSlots: boolean }[] = [];
  showAllReviews = false;

  restaurant: RestaurantItem | null = null;
  reviews: ReviewItem[] = [];
  similarRestaurants: RestaurantItem[] = [];
  otherRecommendations: RestaurantItem[] = [];

  menuItems: any[] = [];
  tags: string[] = [];

  bookingStep: 'date' | 'time' | 'guests' = 'date';
  selectedDate: Date | null = null;
  selectedTime: string | null = null;
  selectedGuests: number = 2;

  guestAvailability: Record<number, boolean> = {};
  guestsLoading = false;


  availableSlots: string[] = [];
  slotsLoading = false;
  slotsError = '';
  availabilityOpen = true;
  availabilityReason = '';

  availableTimes: string[] = [];
  guestOptions: number[] = Array.from({length: 30}, (_, i) => i + 1);

  stripePromise: Promise<Stripe | null> = loadStripe(environment.stripePublishableKey);
  bookingMessage: string = '';
  bookingLoading: boolean = false;
  bookingError: string = '';
  isPaymentRequired: boolean = false;
  bookingDepositAmount: number = 0;

  paymentModalOpen: boolean = false;
  bookingForm = {
    specialRequests: '',
    paymentMethod: 'card'
  };

  private mapInitialized = false;
  private mapInitAttempts = 0;
  private maxMapRetries = 5;

  weeklyHours: { dayOfWeek: number, isClosed: boolean }[] = [];
  overrides: { date: string, isClosed: boolean }[] = [];

  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  private map: any;
  private marker: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.favoritesService.favorites$.subscribe(() => {
      if (this.restaurant) {
        this.isFavorite = this.favoritesService.isFavorite(this.restaurant.id);
        this.cdr.detectChanges();
      }
    });

    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadRestaurant(id);
      } else {
        this.router.navigate(['/restaurants-detail']);
      }
    });

    this.checkLoginStatus();
    this.generateTimeSlots();
  }

  checkLoginStatus(): void {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      this.user = JSON.parse(storedUser);
      this.isLoggedIn = true;
      this.userRole = this.user.role;

      if (this.isRestaurantOwner && this.user.restaurantName) {
        this.user.initials = this.getInitialsFromName(this.user.restaurantName);
      } else {
        const first = this.user.firstName?.charAt(0) || '';
        const last = this.user.lastName?.charAt(0) || '';
        this.user.initials = (first + last).toUpperCase() || 'U';
      }
    } else {
      this.isLoggedIn = false;
      this.user = null;
      this.userRole = null;
    }
  }

  private get isRestaurantOwner(): boolean {
    const role = (this.userRole || '').toUpperCase();
    return role === 'ADMIN'
      || role === 'RESTAURANT_OWNER'
      || role === 'OWNER'
      || role === 'RESTAURANT';
  }

  private getInitialsFromName(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'R';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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
    this.mapInitialized = false;

    this.api.getRestaurantById(id)
      .then((data) => {
        console.log('=== Restaurant Data ===');
        console.log('Full data:', data);

        console.log('TimeSlots in response:', data.timeSlots);
        console.log('TimeSlots type:', typeof data.timeSlots);
        console.log('TimeSlots is array?', Array.isArray(data.timeSlots));
        this.initializeMapWithRetry();

        if (data) {
          this.restaurant = this.mapToRestaurantItem(data);
          this.isFavorite = this.favoritesService.isFavorite(this.restaurant.id);

          this.generateCalendar();
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

  private initializeMapWithRetry(): void {
    this.mapInitAttempts = 0;
    this.tryInitMap();
  }


  private tryInitMap(): void {
    if (this.mapInitialized) return;

    this.mapInitAttempts++;

    if (this.mapInitAttempts > this.maxMapRetries) {
      console.log('Max map retries reached, giving up');
      return;
    }

    if (!this.mapContainer || !this.restaurant) {
      console.log('Map container or restaurant not ready, retry ' + this.mapInitAttempts);
      setTimeout(() => this.tryInitMap(), 300);
      return;
    }

    const container = this.mapContainer.nativeElement;
    if (container.offsetWidth === 0 || container.offsetHeight === 0) {
      console.log('Map container not visible, retry ' + this.mapInitAttempts);
      setTimeout(() => this.tryInitMap(), 400);
      return;
    }

    this.initMap();
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
      menuItems: data.menuItems || []
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
            isHelpful: false,
            helpfulCount: review.helpfulCount || 0
          }));

          if (this.isLoggedIn) {
            this.reviews.forEach(review => {
              this.api.getReviewHelpfulStatus(review.id)
                .then((status: any) => {
                  review.isHelpful = status?.helpful || false;
                  this.cdr.detectChanges();
                })
                .catch(() => {});
            });
          }

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
            ].slice(0, 8);

            const usedIds = new Set(this.similarRestaurants.map(r => r.id));
            this.otherRecommendations = filtered
              .filter((r: any) => !usedIds.has(r.id))
              .slice(0, 8)
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
      const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const isPast = date < todayDate;
      const hasSlots = this.hasAvailableSlotsForDate(i);

      this.calendarDays.push({
        day: i,
        isPast: isPast,
        hasSlots: hasSlots
      });
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

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private loadWeeklyHoursAndOverrides(): void {
    if (!this.restaurant) return;

    const id = this.restaurant.id;

    Promise.all([
      firstValueFrom(this.api.getHoursByRestaurant(id)).catch(() => []),
      firstValueFrom(this.api.getOverridesByRestaurant(id)).catch(() => [])
    ]).then(([hours, overrides]) => {
      this.weeklyHours = (hours || []).map((h: any) => ({
        dayOfWeek: h.dayOfWeek,
        isClosed: h.isClosed === true
      }));

      this.overrides = (overrides || []).map((o: any) => ({
        date: o.overrideDate,
        isClosed: o.isClosed === true
      }));

      this.generateCalendar();
      this.cdr.detectChanges();
    });
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
    if (this.restaurant) {
      this.isFavorite = this.favoritesService.toggleFavorite({
        id: this.restaurant.id,
        name: this.restaurant.name,
        coverPhotoUrl: this.restaurant.coverPhotoUrl || '',
        cuisineType: this.restaurant.cuisineType || '',
        priceRange: this.restaurant.priceRange || '',
        averageRating: this.restaurant.averageRating || 0,
        reviewCount: this.restaurant.reviewCount || 0,
        address: this.restaurant.address || '',
        city: this.restaurant.city || ''
      });
    }
  }

  selectTab(tab: 'about' | 'menu' | 'reviews'): void {
    this.activeTab = tab;
  }

  openBookingModal(): void {
    if (!this.selectedDate || !this.selectedTime || !this.selectedGuests) {
      this.bookingError = 'Please select date, time and guests.';
      return;
    }

    this.bookingSuccess = false;
    this.bookingMessage = '';
    this.bookingError = '';
    this.bookingLoading = false;
    this.bookingForm.paymentMethod = 'card';
    this.bookingForm.specialRequests = '';
    this.paymentModalOpen = false;

    if (this.restaurant) {
      this.api.getRestaurantDeposit(this.restaurant.id)
        .then((depositInfo) => {
          console.log('Deposit info:', depositInfo);
          if (depositInfo && depositInfo.requiresDeposit) {
            this.isPaymentRequired = true;
            this.bookingDepositAmount = depositInfo.amount || 0;
          } else {
            this.isPaymentRequired = false;
            this.bookingDepositAmount = 0;
          }
          this.bookingModalOpen = true;
          this.cdr.detectChanges();
        })
        .catch((error) => {
          console.error('Error fetching deposit info:', error);
          this.isPaymentRequired = false;
          this.bookingDepositAmount = 0;
          this.bookingModalOpen = true;
          this.cdr.detectChanges();
        });
    } else {
      this.bookingModalOpen = true;
    }
  }

  async confirmBooking(): Promise<void> {
    if (!this.selectedDate || !this.selectedTime || !this.selectedGuests || !this.restaurant) {
      this.bookingError = 'Please select date, time and guests.';
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';

    try {
      const availabilityDateStr = this.formatDateToYYYYMMDD(this.selectedDate);
      const avail: any = await firstValueFrom(
        this.api.getAvailability(this.restaurant.id, availabilityDateStr, this.selectedGuests)
      );

      if (!avail?.open) {
        this.bookingError = 'The restaurant is closed on this date.';
        this.bookingLoading = false;
        this.cdr.detectChanges();
        return;
      }

      if (!(avail.slots || []).includes(this.selectedTime)) {
        this.bookingError = `This slot is no longer available for ${this.selectedGuests} guests. Please pick a different time or party size.`;
        this.bookingLoading = false;
        this.cdr.detectChanges();
        return;
      }

      if (this.isPaymentRequired && this.bookingForm.paymentMethod === 'card') {
        this.paymentModalOpen = true;
        this.bookingLoading = false;
        this.cdr.detectChanges();
        return;
      }

      const year = this.selectedDate.getFullYear();
      const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = `${this.selectedTime}:00`;
      const paymentMethodUpper = this.bookingForm.paymentMethod.toUpperCase();

      const reservation = await this.api.createReservation({
        restaurantId: this.restaurant.id,
        date: dateStr,
        time: timeStr,
        guests: this.selectedGuests,
        specialRequests: this.bookingForm.specialRequests || '',
        status: 'PENDING',
        paymentMethod: paymentMethodUpper
      });

      console.log('Reservation created:', reservation);

      if (!reservation || !reservation.id) {
        throw new Error('Reservation was created but no ID was returned');
      }

      await this.api.updateReservation(reservation.id, {
        depositPaid: false,
        depositAmount: this.bookingDepositAmount,
        status: this.isPaymentRequired && this.bookingForm.paymentMethod === 'cash' ? 'PENDING' : 'CONFIRMED'
      });

      this.bookingMessage = this.isPaymentRequired && this.bookingForm.paymentMethod === 'cash'
        ? `Your reservation is confirmed! Please pay the deposit of €${this.bookingDepositAmount} when you arrive at the restaurant.`
        : 'Your reservation has been confirmed.';

      this.bookingSuccess = true;
      this.bookingLoading = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.closeBookingModal();
      }, 3500);

    } catch (error) {
      console.error('Booking failed:', error);
      this.bookingError = error instanceof Error ? error.message : 'Failed to book reservation. Please try again.';
      this.bookingLoading = false;
      this.cdr.detectChanges();
    }
  }

  async processPayment(): Promise<void> {
    if (!this.restaurant || !this.selectedDate || !this.selectedTime) return;

    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';

    try {
      const year = this.selectedDate.getFullYear();
      const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.selectedDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      const timeStr = `${this.selectedTime}:00`;
      const paymentMethodUpper = this.bookingForm.paymentMethod.toUpperCase();

      const reservation = await this.api.createReservation({
        restaurantId: this.restaurant.id,
        date: dateStr,
        time: timeStr,
        guests: this.selectedGuests,
        specialRequests: this.bookingForm.specialRequests || '',
        status: 'PENDING',
        paymentMethod: paymentMethodUpper
      });

      console.log('Reservation created:', reservation);

      if (!reservation || !reservation.id) {
        throw new Error('Reservation was created but no ID was returned');
      }

      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id || null;

      const paymentIntentData = await this.api.createPaymentIntent(
        reservation.id,
        userId
      );

      console.log('Payment intent created:', paymentIntentData);

      const result = await this.api.confirmPayment(paymentIntentData.paymentIntentId);
      console.log('Payment confirmation result:', result);

      if (result.success || result.status === 'SUCCEEDED') {
        await this.api.updateReservation(reservation.id, {
          depositPaid: true,
          depositAmount: this.bookingDepositAmount,
          status: 'CONFIRMED'
        });

        this.bookingMessage = `Your reservation is confirmed! A deposit of €${this.bookingDepositAmount} has been charged.`;
        this.bookingSuccess = true;
        this.paymentModalOpen = false;
        this.bookingLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.closeBookingModal();
        }, 3500);
      } else {
        throw new Error('Payment confirmation failed');
      }

    } catch (error) {
      console.error('Payment failed:', error);
      this.bookingError = error instanceof Error ? error.message : 'Payment processing failed. Please try again.';
      this.bookingLoading = false;
      this.cdr.detectChanges();
    }
  }

  closeBookingModal(): void {
    this.bookingModalOpen = false;
    this.paymentModalOpen = false;
    this.bookingSuccess = false;
    this.bookingMessage = '';
    this.bookingError = '';
    this.bookingLoading = false;
    this.availableSlots = [];
    this.availabilityOpen = true;
    this.availabilityReason = '';
    this.bookingForm.specialRequests = '';
    this.bookingForm.paymentMethod = 'card';
    this.resetBooking();
    this.cdr.detectChanges();
  }

  private fetchAvailability(): void {
    if (!this.restaurant || !this.selectedDate) {
      this.availableSlots = [];
      return;
    }

    const dateStr = this.formatDateToYYYYMMDD(this.selectedDate);
    const guests = this.selectedGuests || 2;

    this.slotsLoading = true;
    this.slotsError = '';

    this.api.getAvailability(this.restaurant.id, dateStr, guests).subscribe({
      next: (res: any) => {
        this.slotsLoading = false;
        this.availabilityOpen = res?.open ?? true;
        this.availabilityReason = res?.reason || '';
        this.availableSlots = res?.slots || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.slotsLoading = false;
        this.slotsError = 'Could not load available times.';
        this.availableSlots = [];
        console.error('[detail] availability failed', err);
        this.cdr.detectChanges();
      }
    });
  }

  hasAvailableSlotsForDate(day: number): boolean {
    const date = new Date(this.currentYear, this.currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);

    if (date < today) return false;

    const dateStr = this.formatDateToYYYYMMDD(date);
    const override = this.overrides.find(o => o.date === dateStr);
    if (override) return !override.isClosed;

    const dow = date.getDay() === 0 ? 7 : date.getDay();
    const hours = this.weeklyHours.find(h => h.dayOfWeek === dow);

    if (!hours) return this.weeklyHours.length === 0;

    return !hours.isClosed;
  }

  private checkAllGuestCounts(): void {
    if (!this.restaurant || !this.selectedDate || !this.selectedTime) return;

    const dateStr = this.formatDateToYYYYMMDD(this.selectedDate);
    const counts = this.guestOptions;

    this.guestsLoading = true;

    let pending = counts.length;
    counts.forEach(count => {
      this.api.getAvailability(this.restaurant!.id, dateStr, count).subscribe({
        next: (res: any) => {
          this.guestAvailability[count] =
            res?.open === true
            && Array.isArray(res.slots)
            && res.slots.includes(this.selectedTime);
          pending--;
          if (pending === 0) {
            this.guestsLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: () => {
          this.guestAvailability[count] = false;
          pending--;
          if (pending === 0) {
            this.guestsLoading = false;
            this.cdr.detectChanges();
          }
        }
      });
    });
  }

  isTimeSlotAvailable(time: string): boolean {
    if (!this.restaurant?.timeSlots) return true;

    const year = this.selectedDate?.getFullYear() || new Date().getFullYear();
    const month = String((this.selectedDate?.getMonth() || new Date().getMonth()) + 1).padStart(2, '0');
    const day = String(this.selectedDate?.getDate() || new Date().getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slot = this.restaurant.timeSlots.find(s =>
      s.slotDate === dateStr &&
      (s.slotTime as string).substring(0, 5) === time &&
      s.isActive !== false
    );

    return true;
  }

  isGuestCountAvailable(guestCount: number): boolean {
    if (!this.restaurant?.timeSlots || !this.selectedDate || !this.selectedTime) {
      return true;
    }

    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slot = this.restaurant.timeSlots.find(s =>
      s.slotDate === dateStr &&
      (s.slotTime as string).substring(0, 5) === this.selectedTime &&
      s.isActive !== false
    );

    if (!slot) return true;
    if (!slot.maxCapacity) return true;
    return guestCount <= slot.maxCapacity;
  }

  getMaxCapacityForSelectedTime(): number | null {
    if (!this.restaurant?.timeSlots || !this.selectedDate || !this.selectedTime) {
      return null;
    }

    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slot = this.restaurant.timeSlots.find(s =>
      s.slotDate === dateStr &&
      (s.slotTime as string).substring(0, 5) === this.selectedTime &&
      s.isActive !== false
    );

    return slot?.maxCapacity || null;
  }

  getMaxCapacityForTime(time: string): number | null {
    if (!this.restaurant?.timeSlots || !this.selectedDate) {
      return null;
    }

    const year = this.selectedDate.getFullYear();
    const month = String(this.selectedDate.getMonth() + 1).padStart(2, '0');
    const day = String(this.selectedDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slot = this.restaurant.timeSlots.find(s =>
      s.slotDate === dateStr &&
      (s.slotTime as string).substring(0, 5) === time &&
      s.isActive !== false
    );

    return slot?.maxCapacity || null;
  }

  async toggleReviewHelpful(review: ReviewItem): Promise<void> {
    if (!this.isLoggedIn) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url }
      });
      return;
    }

    try {
      const result = await this.api.markReviewHelpful(review.id);

      if (result && result.helpful !== undefined) {
        review.isHelpful = result.helpful;
        review.helpfulCount = (review.helpfulCount || 0) + (result.helpful ? 1 : -1);

        const index = this.reviews.findIndex(r => r.id === review.id);
        if (index !== -1) {
          this.reviews[index] = { ...review };
        }

        this.cdr.detectChanges();
        console.log('Helpful status updated:', review.isHelpful);
      }
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      this.bookingError = 'Could not update helpful status. Please try again.';
    }
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
    if (this.mapInitialized || !this.mapContainer || !this.restaurant) return;

    try {
      const container = this.mapContainer.nativeElement;
      const lat = this.restaurant.latitude || 48.8566;
      const lng = this.restaurant.longitude || 2.3522;

      if (this.map) {
        this.map.remove();
        this.map = null;
      }

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

      this.mapInitialized = true;

      setTimeout(() => {
        if (this.map) {
          this.map.invalidateSize();
          console.log('Map successfully initialized');
        }
      }, 500);

    } catch (error) {
      console.error('Error initializing map:', error);
      if (this.mapInitAttempts < this.maxMapRetries) {
        setTimeout(() => this.tryInitMap(), 500);
      }
    }
  }

  generateTimeSlots(): void {
    this.availableTimes = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        this.availableTimes.push(`${h}:${m}`);
      }
    }
  }

  selectDate(day: number): void {
    const selectedDate = new Date(this.currentYear, this.currentMonth, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return;
    }

    this.selectedDate = selectedDate;
    this.selectedTime = null;
    this.bookingStep = 'time';
    this.fetchAvailability();
    this.cdr.detectChanges();
  }

  selectTime(time: string): void {
    if (!this.isTimeSlotAvailable(time) || this.isTimeInPast(time)) {
      return;
    }

    this.selectedTime = time;
    this.bookingStep = 'guests';
    this.checkAllGuestCounts();
    this.cdr.detectChanges();
  }


  async selectGuests(count: number): Promise<void> {
    if (!this.restaurant || !this.selectedDate || !this.selectedTime) {

      this.selectedGuests = count;
      this.bookingStep = 'guests';
      this.cdr.detectChanges();
      return;
    }

    const dateStr = this.formatDateToYYYYMMDD(this.selectedDate);

    try {
      const avail: any = await firstValueFrom(
        this.api.getAvailability(this.restaurant.id, dateStr, count)
      );

      const fits =
        avail?.open === true
        && Array.isArray(avail.slots)
        && avail.slots.includes(this.selectedTime);

      if (!fits) {
        this.bookingError =
          `Sorry, we can't seat ${count} guests at ${this.selectedTime}. Please try fewer guests or pick a different time.`;
        this.cdr.detectChanges();
        return;
      }

      this.bookingError = '';
      this.selectedGuests = count;
      this.bookingStep = 'guests';
      this.cdr.detectChanges();
    } catch (err) {
      console.error('[detail] guest availability check failed', err);
      this.bookingError = 'Could not verify availability. Please try again.';
      this.cdr.detectChanges();
    }
  }

  goBackToDate(): void {
    this.bookingStep = 'date';
    this.selectedTime = null;
    this.cdr.detectChanges();
  }

  goBackToTime(): void {
    this.bookingStep = 'time';
    this.fetchAvailability();
    this.cdr.detectChanges();
  }

  isTimeInPast(time: string): boolean {
    const checkDate = this.selectedDate || new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkDate > today) {
      return false;
    }

    if (checkDate.toDateString() === today.toDateString()) {
      const [hours, minutes] = time.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      return selectedTime < new Date();
    }

    return true;
  }

  isDateInPast(day: number, month: number, year: number): boolean {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  resetBooking(): void {
    this.bookingStep = 'date';
    this.selectedDate = null;
    this.selectedTime = null;
    this.selectedGuests = 2;
    this.availableSlots = [];
    this.availabilityOpen = true;
    this.availabilityReason = '';
    this.cdr.detectChanges();
  }

  getFormattedDate(): string {
    if (!this.selectedDate) return 'Select a date';
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return this.selectedDate.toLocaleDateString('en-US', options);
  }

  getFormattedTime(): string {
    return this.selectedTime || 'Select a time';
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
      this.mapInitialized = false;
    }
  }

}
