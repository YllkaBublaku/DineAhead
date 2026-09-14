import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

type AdminTab =
  | 'overview'
  | 'restaurants'
  | 'users'
  | 'reservations'
  | 'reviews'
  | 'cities'
  | 'settings';

@Component({
  selector: 'app-platform-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './platform-admin-dashboard.html',
  styleUrl: './platform-admin-dashboard.css'
})
export class PlatformAdminDashboard implements OnInit {
  isSidebarOpen = signal(true);
  activeTab = signal<AdminTab>('overview');

  loading = signal(false);
  error = signal('');

  user = { firstName: '', lastName: '', email: '', joined: '', avatar: '' };

  totals = {
    restaurants: 0,
    activeRestaurants: 0,
    users: 0,
    reservationsToday: 0,
    reviews: 0
  };

  restaurants: any[] = [];
  restaurantSearch = '';
  restaurantFilter: 'all' | 'active' | 'inactive' = 'all';
  restaurantSort: 'newest' | 'name' | 'rating' = 'newest';
  restaurantPage = 1;
  restaurantPageSize = 10;

  deleteRestaurantDialogOpen = false;
  deleteRestaurantTarget: any = null;
  deleteRestaurantConfirmText = '';
  deleteRestaurantLoading = false;
  deleteRestaurantError = '';

  users: any[] = [];

  reservations: any[] = [];

  reviews: any[] = [];

  cities: any[] = [];

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const stored = localStorage.getItem('user');
    if (!stored) { this.router.navigate(['/']); return; }

    const u = JSON.parse(stored);
    const role = String(u.role || '').toUpperCase().replace(/^ROLE_/, '');
    if (role !== 'PLATFORM_ADMIN') { this.router.navigate(['/']); return; }

    const first = u.firstName || '';
    const last = u.lastName || '';

    this.user = {
      firstName: first,
      lastName: last,
      email: u.email || '',
      joined: u.createdAt ? new Date(u.createdAt).getFullYear().toString() : '',
      avatar: ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'A'
    };

    this.loadStats();
    this.loadRestaurants();
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setTab(tab: AdminTab) {
    this.activeTab.set(tab);
    if (window.innerWidth < 1024) this.isSidebarOpen.set(false);

    if (tab === 'overview') this.loadStats();
    if (tab === 'restaurants') this.loadRestaurants();
    if (tab === 'users' && this.users.length === 0) this.loadUsers();
    if (tab === 'reservations' && this.reservations.length === 0) this.loadReservations();
    if (tab === 'reviews' && this.reviews.length === 0) this.loadReviews();
    if (tab === 'cities' && this.cities.length === 0) this.loadCities();
  }

  loadStats(): void {
    this.api.getAdminStats().subscribe({
      next: (s: any) => {
        this.totals = {
          restaurants: s.restaurants ?? 0,
          activeRestaurants: s.activeRestaurants ?? 0,
          users: s.users ?? 0,
          reservationsToday: s.reservationsToday ?? 0,
          reviews: s.reviews ?? 0
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] stats failed', err);
        this.showToast('Could not load stats', 'error');
      }
    });
  }

  loadRestaurants(): void {
    this.loading.set(true);
    this.api.getAdminRestaurants().subscribe({
      next: (list: any[]) => {
        this.loading.set(false);
        this.restaurants = (list || []).map(r => ({
          id: r.id,
          name: r.name || 'Unnamed',
          city: r.city?.name || r.city || '',
          cuisineType: r.cuisineType || '',
          priceRange: r.priceRange || '',
          coverPhotoUrl: r.coverPhotoUrl || '',
          averageRating: r.averageRating ?? 0,
          reviewCount: r.reviewCount ?? 0,
          isActive: r.isActive !== false,
          ownerName: r.ownerName
            || (r.owner ? `${r.owner.firstName || ''} ${r.owner.lastName || ''}`.trim() : ''),
          ownerEmail: r.ownerEmail || r.owner?.email || '',
          createdAt: r.createdAt || null
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading.set(false);
        console.error('[admin] restaurants failed', err);
        this.showToast('Could not load restaurants', 'error');
      }
    });
  }

  get filteredRestaurants(): any[] {
    let list = [...this.restaurants];

    if (this.restaurantFilter === 'active') {
      list = list.filter(r => r.isActive);
    } else if (this.restaurantFilter === 'inactive') {
      list = list.filter(r => !r.isActive);
    }

    const q = this.restaurantSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        r.name.toLowerCase().includes(q) ||
        r.city.toLowerCase().includes(q) ||
        r.cuisineType.toLowerCase().includes(q) ||
        r.ownerEmail.toLowerCase().includes(q)
      );
    }

    switch (this.restaurantSort) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'rating':
        list.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'newest':
      default:
        list.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }
    return list;
  }

  get pagedRestaurants(): any[] {
    const start = (this.restaurantPage - 1) * this.restaurantPageSize;
    return this.filteredRestaurants.slice(start, start + this.restaurantPageSize);
  }

  get restaurantTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredRestaurants.length / this.restaurantPageSize));
  }

  restaurantNextPage() {
    if (this.restaurantPage < this.restaurantTotalPages) this.restaurantPage++;
  }

  restaurantPrevPage() {
    if (this.restaurantPage > 1) this.restaurantPage--;
  }

  toggleRestaurantActive(r: any): void {
    const action = r.isActive ? 'Deactivate' : 'Activate';
    if (!confirm(`${action} "${r.name}"?`)) return;

    const req = r.isActive
      ? this.api.adminDeactivateRestaurant(r.id)
      : this.api.adminActivateRestaurant(r.id);

    req.subscribe({
      next: () => {
        r.isActive = !r.isActive;
        this.showToast(`Restaurant ${r.isActive ? 'activated' : 'deactivated'}`);
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] toggle active failed', err);
        this.showToast('Could not change status', 'error');
      }
    });
  }

  openDeleteRestaurant(r: any): void {
    this.deleteRestaurantTarget = r;
    this.deleteRestaurantConfirmText = '';
    this.deleteRestaurantError = '';
    this.deleteRestaurantLoading = false;
    this.deleteRestaurantDialogOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteRestaurant(): void {
    this.deleteRestaurantDialogOpen = false;
    this.deleteRestaurantTarget = null;
    this.cdr.detectChanges();
  }

  confirmDeleteRestaurant(): void {
    if (!this.deleteRestaurantTarget) return;

    if (this.deleteRestaurantConfirmText.trim().toUpperCase() !== 'DELETE') {
      this.deleteRestaurantError = 'Please type DELETE to confirm.';
      return;
    }

    this.deleteRestaurantLoading = true;
    this.deleteRestaurantError = '';

    this.api.adminDeleteRestaurant(this.deleteRestaurantTarget.id).subscribe({
      next: () => {
        this.deleteRestaurantLoading = false;
        this.deleteRestaurantDialogOpen = false;
        this.restaurants = this.restaurants.filter(r => r.id !== this.deleteRestaurantTarget.id);
        this.showToast('Restaurant deleted');
        this.deleteRestaurantTarget = null;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteRestaurantLoading = false;
        console.error('[admin] delete restaurant failed', err);
        this.deleteRestaurantError = err?.error?.message || 'Could not delete restaurant.';
        this.cdr.detectChanges();
      }
    });
  }

  loadUsers(): void {
    this.api.getAdminUsers().subscribe({
      next: (list: any[]) => {
        this.users = list || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] users failed', err);
        this.showToast('Could not load users', 'error');
      }
    });
  }

  loadReservations(): void {
    this.api.getAdminReservations().subscribe({
      next: (list: any[]) => {
        this.reservations = list || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] reservations failed', err);
        this.showToast('Could not load reservations', 'error');
      }
    });
  }

  loadReviews(): void {
    this.api.getAdminReviews().subscribe({
      next: (list: any[]) => {
        this.reviews = list || [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] reviews failed', err);
        this.showToast('Could not load reviews', 'error');
      }
    });
  }

  loadCities(): void {
    this.api.getCities()
      .then((list: any[]) => {
        this.cities = list || [];
        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error('[admin] cities failed', err);
      });
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage = message;
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage = '';
      this.cdr.detectChanges();
    }, 2500);
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('platformAdminGate');

    this.api.logout().subscribe({
      next: () => this.router.navigate(['/']),
      error: () => this.router.navigate(['/'])
    });
  }
}
