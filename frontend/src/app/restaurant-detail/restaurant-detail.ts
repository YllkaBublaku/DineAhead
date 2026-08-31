import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';

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
export class RestaurantDetail implements OnInit {
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

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  calendarDays: { day: number; isPast: boolean }[] = [];
  selectedDate: Date = new Date();

  restaurant: RestaurantItem | null = null;
  reviews: ReviewItem[] = [];
  similarRestaurants: RestaurantItem[] = [];
  otherRecommendations: RestaurantItem[] = [];

  menuItems: any[] = [];

  tags: string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      if (id) {
        this.loadRestaurant(id);
      } else {
        this.router.navigate(['/restaurants']);
      }
    });
    this.generateCalendar();
  }

  loadRestaurant(id: number): void {
    this.loading = true;
    this.error = false;

    this.api.getRestaurantById(id)
      .then((data) => {
        console.log('Restaurant data:', data);
        if (data) {
          this.restaurant = this.mapToRestaurantItem(data);
          this.loadReviews(id);
          this.loadSimilarRestaurants();
          this.generateTags();
          this.loading = false;
        } else {
          this.error = true;
          this.loading = false;
        }
      })
      .catch((error) => {
        console.error('Error loading restaurant:', error);
        this.error = true;
        this.loading = false;
      });
  }

  mapToRestaurantItem(data: any): RestaurantItem {
    return {
      id: data.id,
      name: data.name,
      slug: data.slug,
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
    };
  }

  loadReviews(restaurantId: number): void {
    this.api.getReviewsByRestaurant(restaurantId)
      .then((data) => {
        console.log('Reviews loaded:', data);
        this.reviews = (data || []).map((review: any) => ({
          ...review,
          author: review.user ? `${review.user.firstName} ${review.user.lastName}` : 'Anonymous',
          text: review.comment || '',
          date: review.createdAt ? this.formatDate(review.createdAt) : 'Recently',
          memberSince: 'Member',
          isHelpful: false
        }));
      })
      .catch((error) => {
        console.error('Error loading reviews:', error);
        this.reviews = [];
      });
  }

  loadSimilarRestaurants(): void {
    this.api.getRestaurants()
      .then((data) => {
        if (data && Array.isArray(data)) {
          // Filter out current restaurant and get similar ones
          const filtered = data
            .filter((r: any) => r.id !== this.restaurant?.id)
            .slice(0, 4);
          this.similarRestaurants = filtered.map((r: any) => this.mapToRestaurantItem(r));

          const others = data
            .filter((r: any) => r.id !== this.restaurant?.id)
            .slice(4, 8);
          this.otherRecommendations = others.map((r: any) => this.mapToRestaurantItem(r));
        }
      })
      .catch((error) => {
        console.error('Error loading similar restaurants:', error);
        this.similarRestaurants = [];
        this.otherRecommendations = [];
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
      // Add cuisine type as tag
      if (this.restaurant.cuisineType) tags.add(this.restaurant.cuisineType);
      // Add features as tags
      if (this.restaurant.features) {
        this.restaurant.features.forEach(f => tags.add(f));
      }
      // Add city
      if (this.restaurant.city) tags.add(this.restaurant.city);
    }
    // Add default tags if empty
    if (tags.size === 0) {
      ['French', 'European', 'Cosy', 'Good for families', 'Outdoor dining', 'Romantic'].forEach(t => tags.add(t));
    }
    this.tags = Array.from(tags);
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
    }, 2500);
  }

  closeBookingModal(): void {
    this.bookingModalOpen = false;
    this.bookingSuccess = false;
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

  onSearch(): void {
    this.search.emit({ city: this.searchCity, query: this.searchQuery });
    if (!this.showSearch) {
      this.router.navigate(['/restaurants'], {
        queryParams: {
          city: this.searchCity || 'Paris',
          q: this.searchQuery || undefined,
        },
      });
    }
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
      const date = new Date(dateString);
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
}
