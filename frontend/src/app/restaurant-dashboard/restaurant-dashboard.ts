import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './restaurant-dashboard.html',
  styleUrl: './restaurant-dashboard.css'
})
export class RestaurantDashboard implements OnInit {
  isSidebarOpen = signal(true);
  activeTab = signal<'overview' | 'reservations' | 'tables' | 'schedule' | 'reviews' | 'profile'>('overview');

  restaurantId: number | null = null;
  restaurant = {
    name: '',
    first: '',
    last: '',
    joined: '',
    avatar: ''
  };

  loading = signal(false);
  error = signal('');

  constructor(
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadOwnerRestaurant();
  }

  loadOwnerRestaurant(): void {
    const stored = localStorage.getItem('user');
    if (!stored) { this.error.set('You are not logged in.'); return; }

    const user = JSON.parse(stored);
    const ownerId = user.id ?? user.userId;
    if (!ownerId) { this.error.set('No user id found.'); return; }

    this.loading.set(true);

    this.api.getRestaurantsByOwner(ownerId).subscribe({
      next: (restaurants: any[]) => {
        this.loading.set(false);
        const r = restaurants && restaurants.length ? restaurants[0] : null;
        if (!r) { this.error.set('No restaurant found for this account.'); return; }

        this.restaurantId = r.id;

        const joinedYear = r.createdAt
          ? new Date(r.createdAt).getFullYear().toString()
          : '';

        const nextRestaurant = {
          name: r.name || '',
          first: user.firstName || '',
          last: user.lastName || '',
          joined: joinedYear,
          avatar: this.getRestaurantInitials(r.name || '')
        };

        console.log('[Dashboard] About to set restaurant:', nextRestaurant);

        this.restaurant = { ...nextRestaurant };

        this.cdr.detectChanges();

        this.loadReservations();
        this.loadReviews();
        this.loadTables();
        this.loadSchedule();
        this.loadOverrides();
        this.loadProfile();
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('Could not load restaurant: ' + (err?.error?.message || err.message));
        console.error('[Dashboard] load error:', err);
      }
    });
  }

  private getRestaurantInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'R';
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  loadReservations(): void {
    if (!this.restaurantId) return;
    this.loadTodayReservations();
  }

  private loadTodayReservations(): void {
    if (!this.restaurantId) return;

    this.api.getRestaurantStats(this.restaurantId).subscribe({
      next: (s: any) => {
        this.stats = {
          todayBookings: s.todayBookings ?? 0,
          upcoming: s.upcoming ?? 0,
          noShowRate: s.noShowRate ?? '0%',
          revenue: '€' + Number(s.revenue ?? 0).toLocaleString('en-US', { maximumFractionDigits: 0 }),
          weekRevenue: Array.isArray(s.weekRevenue)
            ? s.weekRevenue.map((v: any) => Number(v) || 0)
            : []
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] stats load failed', err);
      }
    });

    const today = new Date().toISOString().split('T')[0];

    this.api.getReservationsByRestaurantAndDate(this.restaurantId, today).subscribe({
      next: (raw: any) => {
        let list: any[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.content)) {
          list = raw.content;
        } else if (raw && Array.isArray(raw.data)) {
          list = raw.data;
        } else if (raw && typeof raw === 'object') {
          list = [raw];
        }

        this.reservations = list.map((r: any) => {
          const first = r.customerFirstName || r.user?.firstName || '';
          const last  = r.customerLastName  || r.user?.lastName  || '';
          const name  = `${first} ${last}`.trim() || 'Guest';

          return {
            id: r.id,
            name,
            time: r.reservationTime ? String(r.reservationTime).substring(0, 5) : '',
            guests: r.partySize ?? 0,
            table: r.tableNumber != null ? 'T' + r.tableNumber : '-',
            status: this.formatStatus(r.status),
            type: r.specialRequests || 'Dinner'
          };
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] today reservations load failed', err);
        this.reservations = [];
        this.cdr.detectChanges();
      }
    });
  }

  private formatStatus(status: string): string {
    if (!status) return 'Pending';
    const map: Record<string, string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      SEATED: 'Seated',
      NO_SHOW: 'No Show',
      CANCELLED: 'Cancelled'
    };
    return map[status.toUpperCase()] || 'Pending';
  }

  maxWeekRevenue(): number {
    const arr = this.stats.weekRevenue || [];
    return arr.length ? Math.max(...arr, 1) : 1;
  }

  isTodayIndex(index: number): boolean {
    const jsDay = new Date().getDay();
    const idx = jsDay === 0 ? 6 : jsDay - 1;
    return index === idx;
  }

  loadReviews(): void {}
  loadTables(): void {}
  loadSchedule(): void {}
  loadOverrides(): void {}
  loadProfile(): void {}

  toggleSidebar() { this.isSidebarOpen.update(v => !v); }
  setTab(tab: 'overview' | 'reservations' | 'tables' | 'schedule' | 'reviews' | 'profile') {
    this.activeTab.set(tab);
    if (window.innerWidth < 1024) this.isSidebarOpen.set(false);
  }
  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/']);
  }

  stats = {
    todayBookings: 0,
    upcoming: 0,
    noShowRate: '0%',
    revenue: '€0',
    weekRevenue: [] as number[]
  };

  reservations: any[] = [];
  tables: any[] = [];
  schedule: any[] = [];
  scheduleOverrides: any[] = [];
  reviews: any[] = [];
  profile = { restaurantName: '', address: '', siret: '', phone: '', email: '', bankAccount: '' };
}
