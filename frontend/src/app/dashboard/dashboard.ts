import { Component, signal, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard implements OnInit {
  isSidebarOpen = signal(true);
  activeTab = signal<'bookings' | 'favorites' | 'reviews' | 'personal'>('bookings');

  userId: number | null = null;
  userRole: string | null = null;

  loadingBookings = signal(false);
  bookingsError = signal('');

  loadingReviews = signal(false);
  reviewsError = signal('');

  loadingPersonal = signal(false);
  personalError = signal('');
  personalSaving = signal(false);

  loadingFavorites = signal(false);
  favoritesError = signal('');

  toastMessage = signal('');
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  bookings: any[] = [];

  favorites: any[] = [];
  reviews: any[] = [];
  user = { firstName: '', lastName: '', email: '', phone: '', joined: '' };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const stored = localStorage.getItem('user');
    if (stored) {
      try {
        const u = JSON.parse(stored);
        this.userId = u.id ?? u.userId ?? null;
        this.userRole = u.role || null;

        this.user.firstName = u.firstName || '';
        this.user.lastName = u.lastName || '';
        this.user.email = u.email || '';
        this.user.phone = u.phone || '';
        this.user.joined = u.createdAt
          ? new Date(u.createdAt).getFullYear().toString()
          : '';
      } catch {}
    }

    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'bookings' || tab === 'favorites' || tab === 'reviews' || tab === 'personal') {
        this.activeTab.set(tab);
      } else {
        this.activeTab.set('bookings');
      }

      if (this.activeTab() === 'bookings') {
        this.loadBookings();
      }
    });

    this.loadPersonal();
  }

  loadBookings(): void {
    if (!this.userId) {
      this.bookingsError.set('You must be logged in.');
      return;
    }

    this.loadingBookings.set(true);
    this.bookingsError.set('');

    this.api.getReservationsByUser(this.userId).subscribe({
      next: (raw: any) => {
        this.loadingBookings.set(false);
        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);

        this.bookings = list
          .map((r: any) => {
            const dateStr = r.reservationDate;
            const timeStr = r.reservationTime
              ? String(r.reservationTime).substring(0, 5)
              : '';
            const when = dateStr ? new Date(`${dateStr}T${timeStr || '00:00'}`) : null;

            return {
              id: r.id,
              restaurantId: r.restaurantId,
              name: r.restaurantName || 'Restaurant',
              date: dateStr,
              time: timeStr,
              guests: r.partySize ?? 0,
              status: this.formatStatus(r.status),
              rawStatus: (r.status || '').toUpperCase(),
              specialRequests: r.specialRequests || '',
              when
            };
          })
          .sort((a: any, b: any) => {
            const now = new Date();
            const aFuture = a.when && a.when >= now ? 1 : 0;
            const bFuture = b.when && b.when >= now ? 1 : 0;
            if (aFuture !== bFuture) return bFuture - aFuture;
            return (a.when?.getTime() || 0) - (b.when?.getTime() || 0);
          });

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingBookings.set(false);
        this.bookingsError.set('Could not load your bookings.');
        console.error('[Dashboard] bookings load failed', err);
      }
    });
  }

  loadReviews(): void {
    if (!this.userId) {
      this.reviewsError.set('You must be logged in.');
      return;
    }

    this.loadingReviews.set(true);
    this.reviewsError.set('');

    this.api.getReviewsByUser(this.userId)
      .then((raw: any) => {
        this.loadingReviews.set(false);

        const list = Array.isArray(raw) ? raw : [];

        this.reviews = list.map((r: any) => ({
          id: r.id,
          restaurant: r.restaurantName || 'Restaurant',
          restaurantId: r.restaurantId ?? null,
          rating: r.rating ?? 0,
          date: r.createdAt ? this.formatReviewDate(r.createdAt) : 'Recently',
          text: r.comment || 'No comment provided.',
          helpfulCount: r.helpfulCount ?? 0
        }));

        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        this.loadingReviews.set(false);
        this.reviewsError.set('Could not load your reviews.');
        console.error('[Dashboard] reviews load failed', err);
      });
  }

  loadPersonal(): void {
    if (!this.userId) return;

    this.loadingPersonal.set(true);
    this.personalError.set('');

    this.api.getUserById(this.userId).subscribe({
      next: (u: any) => {
        this.loadingPersonal.set(false);

        this.user.firstName = u.firstName || '';
        this.user.lastName = u.lastName || '';
        this.user.email = u.email || '';
        this.user.phone = u.phone || '';
        this.user.joined = u.createdAt
          ? new Date(u.createdAt).getFullYear().toString()
          : this.user.joined;

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingPersonal.set(false);
        this.personalError.set('Could not load your profile.');
        console.error('[Dashboard] personal load failed', err);
      }
    });
  }

  loadFavorites(): void {
    if (!this.userId) {
      this.favoritesError.set('You must be logged in.');
      return;
    }

    this.loadingFavorites.set(true);
    this.favoritesError.set('');

    this.api.getUserFavorites(this.userId).subscribe({
      next: (raw: any) => {
        this.loadingFavorites.set(false);
        const list = Array.isArray(raw) ? raw : [];

        this.favorites = list.map((f: any) => ({
          id: f.restaurantId ?? f.id,
          favoriteId: f.id,
          restaurantId: f.restaurantId ?? null,
          name: f.name || 'Restaurant',
          image: f.coverPhotoUrl || '',
          cuisine: `${f.cuisineType || 'Various'} • ${f.priceRange || '€€'}`,
          rating: f.averageRating != null ? Number(f.averageRating).toFixed(1) : 'N/A',
          description: f.address || '',
          offer: f.specialOffer || ''
        }));

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loadingFavorites.set(false);
        this.favoritesError.set('Could not load your favorites.');
        console.error('[Dashboard] favorites load failed', err);
      }
    });
  }

  savePersonal(): void {
    if (!this.userId) return;

    this.personalSaving.set(true);
    this.personalError.set('');

    const payload = {
      firstName: this.user.firstName,
      lastName: this.user.lastName,
      email: this.user.email,
      phone: this.user.phone
    };

    this.api.updateUser(this.userId, payload).subscribe({
      next: (u: any) => {
        this.personalSaving.set(false);
        this.showToast('Profile updated');

        this.user.firstName = u.firstName || this.user.firstName;
        this.user.lastName = u.lastName || this.user.lastName;
        this.user.email = u.email || this.user.email;
        this.user.phone = u.phone || this.user.phone;

        const stored = localStorage.getItem('user');
        if (stored) {
          try {
            const cached = JSON.parse(stored);
            cached.firstName = this.user.firstName;
            cached.lastName = this.user.lastName;
            cached.email = this.user.email;
            cached.phone = this.user.phone;
            localStorage.setItem('user', JSON.stringify(cached));
          } catch {}
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        this.personalSaving.set(false);
        this.personalError.set(err?.error?.message || 'Could not save your profile.');
        this.showToast('Could not save profile', 'error');
      }
    });
  }

  private formatReviewDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Recently';
    }
  }

  private formatStatus(s: string): string {
    if (!s) return 'Pending';
    const map: Record<string, string> = {
      PENDING: 'Pending',
      CONFIRMED: 'Confirmed',
      SEATED: 'Seated',
      NO_SHOW: 'No Show',
      CANCELLED: 'Cancelled'
    };
    return map[s.toUpperCase()] || 'Pending';
  }

  cancelBooking(booking: any): void {
    if (!confirm(`Cancel your reservation at ${booking.name} on ${booking.date}?`)) return;

    this.api.cancelReservation(booking.id).subscribe({
      next: () => {
        this.showToast('Reservation cancelled');
        this.loadBookings();
      },
      error: (err) => {
        console.error('[Dashboard] cancel failed', err);
        this.showToast('Could not cancel reservation', 'error');
      }
    });
  }

  modifyBooking(booking: any): void {
    if (!booking.restaurantId) {
      this.showToast('Cannot modify — restaurant missing', 'error');
      return;
    }

    this.router.navigate(['/restaurant', booking.restaurantId], {
      queryParams: {
        modifyReservationId: booking.id,
        date: booking.date,
        time: booking.time,
        guests: booking.guests
      }
    });
  }


  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setTab(tab: 'bookings' | 'favorites' | 'reviews' | 'personal') {
    this.activeTab.set(tab);
    if (window.innerWidth < 1024) this.isSidebarOpen.set(false);

    if (tab === 'bookings') this.loadBookings();
    if (tab === 'reviews') this.loadReviews();
    if (tab === 'personal') this.loadPersonal();
    if (tab === 'favorites') this.loadFavorites();
  }

  goToHelp() {
    this.router.navigate(['/help']);
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/']);
  }

  showToast(message: string, type: 'success' | 'error' = 'success'): void {
    this.toastMessage.set(message);
    this.toastType = type;
    if (this.toastTimer) clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => {
      this.toastMessage.set('');
      this.cdr.detectChanges();
    }, 2500);
  }

  toggleFavorite(restaurantId: number): void {
    if (!this.userId) return;

    const removed = this.favorites.find(f => f.restaurantId === restaurantId);
    this.favorites = this.favorites.filter(f => f.restaurantId !== restaurantId);
    this.cdr.detectChanges();

    this.api.removeFavorite(this.userId, restaurantId).subscribe({
      next: () => {
        this.showToast('Removed from favorites');
      },
      error: (err) => {
        console.error('[Dashboard] remove favorite failed', err);

        if (removed) this.favorites = [...this.favorites, removed];
        this.showToast('Could not remove favorite', 'error');
        this.cdr.detectChanges();
      }
    });
  }
}
