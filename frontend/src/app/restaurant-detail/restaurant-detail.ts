import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

export interface RestaurantItem {
  id: string;
  name: string;
  image: string;
  gallery: string[];
  cuisine: string;
  priceLevel: string;
  rating: number;
  score: number;
  reviewCount: number;
  neighborhood: string;
  address: string;
  description: string;
  badges: string[];
  isPromoted?: boolean;
  isMichelin?: boolean;
  isInsider?: boolean;
  specialOffer?: string;
  bookedCountToday: number;
  timeslots: any[];
  coords: { x: number; y: number; lat: number; lng: number };
}

export interface MenuItem {
  name: string;
  price: number;
  description?: string;
}

export interface ReviewItem {
  author: string;
  date: string;
  rating: number;
  text: string;
  images?: string[];
  memberSince: string;
  isHelpful: boolean;
}

export interface RecommendationItem {
  id: string;
  name: string;
  image: string;
  rating: number;
  cuisine: string;
  location: string;
  price: string;
  offer?: string;
  badge?: string;
}

const MOCK_RESTAURANTS: RestaurantItem[] = [
  {
    id: 'rest-1',
    name: "L'Arpège by Alain Passard",
    image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'French Contemporary',
    priceLevel: '€€€€',
    rating: 4.9,
    score: 9.8,
    reviewCount: 3420,
    neighborhood: '7th Arr. (Invalides)',
    address: '84 Rue de Varenne, 75007 Paris',
    description: 'Three Michelin-starred vegetable-forward haute cuisine with seasonal farm produce and exquisite wine pairings.',
    badges: ['3-Star Michelin', 'Exceptional', 'Insider'],
    isPromoted: true,
    isMichelin: true,
    isInsider: true,
    specialOffer: 'Up to -20% on Tasting Menu',
    bookedCountToday: 48,
    timeslots: [
      { time: '18:30', discount: '-20%' },
      { time: '19:00', hot: true },
      { time: '19:30' },
      { time: '20:15', discount: '-20%' },
      { time: '21:00' },
    ],
    coords: { x: 38, y: 44, lat: 48.8556, lng: 2.3168 },
  },
  {
    id: 'rest-2',
    name: 'Trattoria Dalloste Bistecca',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&h=600&q=80',
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'Italian Steakhouse',
    priceLevel: '€€€',
    rating: 4.7,
    score: 9.4,
    reviewCount: 6401,
    neighborhood: '1st Arr. (Louvre / Châtelet)',
    address: '24 Rue de Rivoli, 75001 Paris',
    description: 'Legendary dry-aged Chianina Florentine steaks, artisanal truffle pasta, and Tuscan reserve wines in an energetic setting.',
    badges: ['Up to -50% · DineAhead Summer', 'Yums x2'],
    specialOffer: 'Up to -50% · DineAhead Summer',
    bookedCountToday: 82,
    timeslots: [
      { time: '18:00', discount: '-50%' },
      { time: '18:45', discount: '-50%' },
      { time: '19:30', hot: true },
      { time: '20:00' },
      { time: '20:45', discount: '-30%' },
    ],
    coords: { x: 55, y: 40, lat: 48.8584, lng: 2.3488 },
  },
  {
    id: 'rest-3',
    name: 'Artisan de la Truffe Montmartre',
    image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'French Gourmet',
    priceLevel: '€€€',
    rating: 4.8,
    score: 9.4,
    reviewCount: 3640,
    neighborhood: '9th Arr. (Opéra / Pigalle)',
    address: '19 Rue des Martyrs, 75009 Paris',
    description: 'An ode to black and white truffles infused across artisanal pasta, aged ribeye, burrata, and gourmet burgers.',
    badges: ['Insider', 'Up to -50%', 'Yums x2'],
    isInsider: true,
    specialOffer: 'Up to -50% · DineAhead Summer',
    bookedCountToday: 65,
    timeslots: [
      { time: '19:00', discount: '-50%' },
      { time: '19:30', discount: '-50%' },
      { time: '20:00', hot: true },
      { time: '20:30' },
      { time: '21:15', discount: '-40%' },
    ],
    coords: { x: 48, y: 22, lat: 48.8789, lng: 2.3392 },
  },
  {
    id: 'rest-4',
    name: 'Hostaria Ago e Lillo Roma',
    image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'Italian Roman',
    priceLevel: '€€',
    rating: 4.7,
    score: 9.2,
    reviewCount: 9255,
    neighborhood: '4th Arr. (Le Marais)',
    address: '12 Rue Saint-Antoine, 75004 Paris',
    description: 'Authentic Roman carbonara with crispy guanciale, cacio e pepe tossed in pecorino wheels, and homemade tiramisu.',
    badges: ['Best Value', 'Up to -50%'],
    specialOffer: 'Up to -50% · DineAhead Summer',
    bookedCountToday: 94,
    timeslots: [
      { time: '18:15', discount: '-50%' },
      { time: '19:00' },
      { time: '19:45', hot: true },
      { time: '20:30' },
      { time: '21:00', discount: '-30%' },
    ],
    coords: { x: 65, y: 48, lat: 48.8542, lng: 2.3612 },
  },
  {
    id: 'rest-5',
    name: 'Trattoria da Nuti',
    image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'Italian & Steaks',
    priceLevel: '€€€',
    rating: 4.6,
    score: 9.1,
    reviewCount: 3447,
    neighborhood: '8th Arr. (Madeleine)',
    address: '15 Boulevard de la Madeleine, 75008 Paris',
    description: 'Handmade tagliatelle flambéed inside whole 24-month Parmigiano Reggiano wheels right beside your table.',
    badges: ['Top 100', 'Live Preparation', 'Up to -50%'],
    specialOffer: 'Up to -50% · DineAhead Summer',
    bookedCountToday: 39,
    timeslots: [
      { time: '18:30', discount: '-50%' },
      { time: '19:15', discount: '-50%' },
      { time: '20:00', hot: true },
      { time: '20:45' },
    ],
    coords: { x: 42, y: 32, lat: 48.8702, lng: 2.3245 },
  },
  {
    id: 'rest-6',
    name: "Terry's Café Paris",
    image: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'French Bistro',
    priceLevel: '€€',
    rating: 4.5,
    score: 9.0,
    reviewCount: 12708,
    neighborhood: '15th Arr. (Vaugirard)',
    address: '45 Rue de Vaugirard, 75015 Paris',
    description: 'Lush floral-draped Parisian bistro serving duck confit, beef bourguignon, and fresh cocktails on a heated patio.',
    badges: ['Most Popular', 'Up to -50%', 'Yums x2'],
    specialOffer: 'Up to -50% · DineAhead Summer',
    bookedCountToday: 110,
    timeslots: [
      { time: '18:00', discount: '-50%' },
      { time: '18:30', discount: '-50%' },
      { time: '19:15' },
      { time: '20:00', hot: true },
      { time: '20:30' },
    ],
    coords: { x: 30, y: 62, lat: 48.8415, lng: 2.3012 },
  },
  {
    id: 'rest-7',
    name: 'Restaurant Kei Paris',
    image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'French Fine Dining',
    priceLevel: '€€€€',
    rating: 5.0,
    score: 10.0,
    reviewCount: 890,
    neighborhood: '1st Arr. (Palais-Royal)',
    address: '5 Rue Coq Héron, 75001 Paris',
    description: 'Three Michelin stars under Chef Kei Kobayashi fusing French haute cuisine precision with Japanese aesthetic mastery.',
    badges: ['3-Star Michelin', 'Chef Kei Kobayashi'],
    isMichelin: true,
    bookedCountToday: 24,
    timeslots: [
      { time: '19:30', hot: true },
      { time: '20:00' },
      { time: '20:45' },
    ],
    coords: { x: 52, y: 36, lat: 48.8643, lng: 2.3421 },
  },
  {
    id: 'rest-8',
    name: 'La Reine du Kashmir',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&h=600&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=800&h=600&q=80',
    ],
    cuisine: 'Indian & Mughlai',
    priceLevel: '€€',
    rating: 4.8,
    score: 9.5,
    reviewCount: 2908,
    neighborhood: '10th Arr. (Canal Saint-Martin)',
    address: '77 Rue du Faubourg Saint-Denis, 75010 Paris',
    description: 'Aromatic saffron biryanis, garlic butter naans, and rich Kashmiri rogan josh cooked over traditional charcoal tandoors.',
    badges: ['Up to -50%', 'Yums x2'],
    specialOffer: 'Up to -50% · DineAhead Summer',
    bookedCountToday: 53,
    timeslots: [
      { time: '18:30', discount: '-50%' },
      { time: '19:15', discount: '-50%' },
      { time: '20:00', hot: true },
      { time: '20:45' },
    ],
    coords: { x: 62, y: 26, lat: 48.8741, lng: 2.3556 },
  },
];


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
  onHeaderSearch(event: { city: string; query: string }): void {
    this.searchCity = event.city;
    this.searchQuery = event.query;
  }
  @Input() showSearch = false;
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  activeTab: 'about' | 'menu' | 'reviews' = 'about';
  isFavorite = false;
  bookingSuccess = false;
  bookingModalOpen = false;
  selectedTimeslot: string | null = null;

  currentMonth = 'August 2026';
  calendarDays: any[] = [
    { day: 19, discount: '-20%' }, { day: 20, discount: '-20%' }, { day: 21, discount: '-20%' },
    { day: 24, discount: '-50%' }, { day: 25, discount: '-50%' }, { day: 26, discount: '-50%' },
    { day: 27, discount: '-50%' }, { day: 28, discount: '-50%' }, { day: 29, discount: '-50%' },
    { day: 31, discount: '-50%' }, { day: 1, discount: '-50%' }, { day: 2, discount: '-50%' },
    { day: 3, discount: '-20%' }, { day: 4, discount: '-20%' }, { day: 5, discount: '-20%' },
  ];

  restaurant: RestaurantItem | null = null;

  menuItems: MenuItem[] = [
    { name: 'Planche de charcuterie', price: 10 },
    { name: 'Planche de fromages', price: 10 },
    { name: 'Planche mixte', price: 19, description: 'Assortment of charcuteries and cheeses' },
    { name: 'Pain Perdu', price: 12, description: 'The perfect dessert' }
  ];

  reviews: ReviewItem[] = [
    {
      author: 'Jennifer E.',
      rating: 10,
      date: '4 days ago',
      memberSince: '3 months on DineAhead',
      text: 'Lovely quite area away from everything else. Excellent service and food was wonderful. Get the Pain Perdu for dessert!',
      images: [
        'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=100&h=100&q=80',
        'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=100&h=100&q=80',
        'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=100&h=100&q=80',
      ],
      isHelpful: false
    }
  ];

  similarRestaurants: RecommendationItem[] = [
    { id: '1', name: 'Nomicos', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&h=300&q=80', rating: 9.4, cuisine: 'French', location: '75016, Paris', price: '€129', badge: 'MICHELIN GUIDE' },
    { id: '2', name: 'Sorella', image: 'https://images.unsplash.com/photo-1551183053-bf91a1d81141?auto=format&fit=crop&w=400&h=300&q=80', rating: 9.2, cuisine: 'Italian', location: '75016, Paris', price: '€31' },
    { id: '3', name: 'Mr Zhang', image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=400&h=300&q=80', rating: 9.4, cuisine: 'Asian', location: '75116, Paris', price: '€20', offer: 'Up to -30%' }
  ];

  otherRecommendations: RecommendationItem[] = [
    { id: '4', name: 'La Clap', image: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=400&h=300&q=80', rating: 8.6, cuisine: 'American', location: '75005, Paris', price: '€10', offer: 'Up to -50% · TheFork Summer' },
    { id: '5', name: 'UzuMaki', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&h=300&q=80', rating: 9.1, cuisine: 'Japanese', location: '75015, Paris', price: '€10', offer: 'Up to -30%' },
    { id: '6', name: 'Kungfu Nouilles', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&h=300&q=80', rating: 9.3, cuisine: 'Chinese', location: '75008, Paris', price: '€10', offer: 'Up to -30%' }
  ];

  tags: string[] = ['French', 'European', 'Bachelor party', 'Brasserie', 'Café', 'Cosy', 'Good for a business lunch', 'Good for families', 'Kid-friendly', 'Lunch', 'Outdoor dining', 'Romantic', 'Vegetarian dishes', 'American Express', 'Cocktail', 'Continuous service', 'Wifi'];

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const id = params['id'];
      const foundRestaurant = MOCK_RESTAURANTS.find(r => r.id === id);

      if (foundRestaurant) {
        this.restaurant = foundRestaurant;
      } else {
        this.router.navigate(['/restaurants']);
      }
    });
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
    review.isHelpful = !review.isHelpful;
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
      const yOffset = -110; // Offset to leave room for the sticky header
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
}
