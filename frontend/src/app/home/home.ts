import { Component, OnInit, ChangeDetectorRef  } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';
import { FavoritesService } from '../services/favorites.service';

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
  description?: string;
  specialOffer?: string;
  latitude?: number;
  longitude?: number;
  cityImageUrl?: string;
  cuisineImageUrl?: string;
}

export interface CityItem {
  id: number;
  name: string;
  imageUrl: string;
  country: string;
  countryFlag: string;
  restaurantCount: number;
}

export interface CuisineItem {
  name: string;
  image: string;
  count: number;
}

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, FormsModule, Header, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  constructor(
    private router: Router,
    private api: ApiService,
    private favoritesService: FavoritesService,
    private cdr: ChangeDetectorRef
  ) {}

  mobileMenuOpen = false;
  searchCity = 'Paris';
  searchQuery = '';
  loading = false;

  recommendedRestaurants: RestaurantItem[] = [];
  newRestaurants: RestaurantItem[] = [];
  mostBookedRestaurants: RestaurantItem[] = [];
  allRestaurants: RestaurantItem[] = [];
  offerRestaurants: RestaurantItem[] = [];
  cities: CityItem[] = [];
  cuisines: CuisineItem[] = [];

  ngOnInit(): void {
    this.loadRestaurants();
    this.loadCities();
  }

  loadCities(): void {
    this.api.getCities()
      .then((data) => {
        if (data && Array.isArray(data)) {
          this.cities = data.map((city: any) => ({
            id: city.id,
            name: city.name,
            imageUrl: city.imageUrl,
            country: city.country,
            countryFlag: city.countryFlag,
            restaurantCount: city.restaurantCount || 0
          }));
          this.cdr.detectChanges();
        }
      })
      .catch((error) => {
        console.error('Error loading cities:', error);
      });
  }

  loadRestaurants(): void {
    this.loading = true;

    this.api.getHomeData()
      .then((data: any) => {
        console.log('Home data loaded:', data);
        console.log('Restaurants count:', data?.restaurants?.length);
        console.log('First restaurant:', data?.restaurants?.[0]);

        if (data && data.restaurants && data.restaurants.length > 0) {
          this.allRestaurants = data.restaurants.map((r: any) => this.mapToRestaurantItem(r));

          console.log('All restaurants after mapping:', this.allRestaurants.length);

          this.offerRestaurants = this.getOfferRestaurants();
          this.recommendedRestaurants = this.getRecommendedRestaurants();
          this.newRestaurants = this.getNewRestaurants();
          this.mostBookedRestaurants = this.getMostBookedRestaurants();

          console.log('Offer restaurants:', this.offerRestaurants.length);
          console.log('Recommended restaurants:', this.recommendedRestaurants.length);
          console.log('New restaurants:', this.newRestaurants.length);
          console.log('Most booked restaurants:', this.mostBookedRestaurants.length);

          this.cuisines = this.extractCuisines();

          console.log('Cities:', this.cities.length);
          console.log('Cuisines:', this.cuisines.length);

          this.cdr.detectChanges();
        } else {
          console.warn('No restaurants found in API response');
          this.allRestaurants = [];
          this.cities = [];
          this.cuisines = [];
        }

        this.loading = false;
        this.cdr.detectChanges();
      })
      .catch((error) => {
        console.error('Error loading home data:', error);
        this.loading = false;
        this.allRestaurants = [];
        this.offerRestaurants = [];
        this.recommendedRestaurants = [];
        this.newRestaurants = [];
        this.mostBookedRestaurants = [];
        this.cities = [];
        this.cuisines = [];
        this.cdr.detectChanges();
      });
  }

  mapToRestaurantItem(data: any): RestaurantItem {
    return {
      id: data.id,
      name: data.name || 'Restaurant',
      slug: data.slug || '',
      address: data.address || '',
      city: data.city || 'Paris',
      cuisineType: data.cuisineType || 'Various',
      priceRange: data.priceRange || '€€',
      coverPhotoUrl: data.coverPhotoUrl || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&h=600&q=80',
      averageRating: data.averageRating || 0,
      reviewCount: data.reviewCount || 0,
      description: data.description || '',
      specialOffer: data.specialOffer || null,
      latitude: data.latitude,
      longitude: data.longitude,
      cityImageUrl: data.cityImageUrl || null,
      cuisineImageUrl: data.cuisineImageUrl || null
    };
  }

  extractCuisines(): CuisineItem[] {
    const cuisineMap = new Map<string, { count: number; image: string }>();

    this.allRestaurants.forEach(rest => {
      const cuisine = rest.cuisineType || 'Various';
      const image = rest.cuisineImageUrl || 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&h=400&q=80';

      if (cuisineMap.has(cuisine)) {
        const existing = cuisineMap.get(cuisine)!;
        cuisineMap.set(cuisine, { count: existing.count + 1, image: existing.image });
      } else {
        cuisineMap.set(cuisine, { count: 1, image: image });
      }
    });

    return Array.from(cuisineMap.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 10)
      .map(([name, data]) => ({
        name,
        count: data.count,
        image: data.image
      }));
  }

  getOfferRestaurants(): RestaurantItem[] {
    return this.allRestaurants
      .filter(r => r.specialOffer && r.specialOffer.trim() !== '')
      .slice(0, 6);
  }

  getRecommendedRestaurants(): RestaurantItem[] {
    return [...this.allRestaurants]
      .sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0))
      .slice(0, 10);
  }

  getNewRestaurants(): RestaurantItem[] {
    return [...this.allRestaurants]
      .sort((a, b) => (b.id || 0) - (a.id || 0))
      .slice(0, 8);
  }

  getMostBookedRestaurants(): RestaurantItem[] {
    return [...this.allRestaurants]
      .sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0))
      .slice(0, 8);
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

  scrollCarousel(elementId: string, offset: number): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  onSearch(): void {
    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: this.searchCity || 'Paris',
        q: this.searchQuery || undefined,
      },
    });
  }

  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }
}
