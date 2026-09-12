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
  allReservations: any[] = [];
  reservations: any[] = [];

  loading = signal(false);
  error = signal('');

  stats = {
    todayBookings: 0,
    upcoming: 0,
    noShowRate: '0%',
    revenue: '€0',
    weekRevenue: [] as number[]
  };

  tables: any[] = [];
  tableModalOpen = false;
  editingTable: any = null;
  tableForm = {
    tableNumber: '',
    minCapacity: 2,
    maxCapacity: 4,
    status: 'Available'
  };
  tableSaving = false;
  tableError = '';

  schedule: any[] = [];
  scheduleOverrides: any[] = [];
  scheduleSaving = false;
  scheduleError = '';

  overrideModalOpen = false;
  editingOverride: any = null;
  overrideForm = {
    overrideDate: '',
    openingTime: '11:00',
    closingTime: '22:00',
    isClosed: false,
    reason: ''
  };
  overrideSaving = false;
  overrideError = '';

  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  private toastTimer: any = null;

  reviews: any[] = [];
  reviewResponseDrafts: Record<number, string> = {};
  reviewSavingId: number | null = null;

  profile = {
    restaurantName: '',
    address: '',
    phone: '',
    email: '',
    siret: '',
    bankAccount: '',
    description: '',
    cuisineType: '',
    priceRange: '',
    specialOffer: '',
    coverPhotoUrl: ''
  };

  profileSaving = false;

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

        this.restaurant = {
          name: r.name || '',
          first: user.firstName || '',
          last: user.lastName || '',
          joined: joinedYear,
          avatar: this.getRestaurantInitials(r.name || '')
        };

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
    this.loadAllReservations();
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
      error: (err) => console.error('[Dashboard] stats load failed', err)
    });

    const today = new Date().toISOString().split('T')[0];

    this.api.getReservationsByRestaurantAndDate(this.restaurantId, today).subscribe({
      next: (raw: any) => {
        const list = this.normalizeToList(raw);

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

  private loadAllReservations(): void {
    if (!this.restaurantId) return;

    this.api.getReservationsByRestaurant(this.restaurantId).subscribe({
      next: (raw: any) => {
        const list = this.normalizeToList(raw);
        const now = new Date();

        this.allReservations = list
          .map((r: any) => {
            const first = r.customerFirstName || r.user?.firstName || '';
            const last  = r.customerLastName  || r.user?.lastName  || '';
            const name  = `${first} ${last}`.trim() || 'Guest';

            const dateStr = r.reservationDate;
            const timeStr = r.reservationTime
              ? String(r.reservationTime).substring(0, 5)
              : '00:00';
            const when = dateStr ? new Date(`${dateStr}T${timeStr}`) : null;

            return {
              id: r.id,
              name,
              date: dateStr,
              time: timeStr,
              when,
              guests: r.partySize ?? 0,
              table: r.tableNumber != null ? 'T' + r.tableNumber : '-',
              status: this.formatStatus(r.status),
              rawStatus: (r.status || '').toUpperCase(),
              type: r.specialRequests || 'Dinner'
            };
          })
          .sort((a: any, b: any) => {
            const aFuture = a.when && a.when >= now ? 1 : 0;
            const bFuture = b.when && b.when >= now ? 1 : 0;
            if (aFuture !== bFuture) return bFuture - aFuture;
            return (a.when?.getTime() || 0) - (b.when?.getTime() || 0);
          });

        this.syncOverviewFromAll();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] all reservations load failed', err);
        this.allReservations = [];
        this.cdr.detectChanges();
      }
    });
  }

  private syncOverviewFromAll(): void {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    this.reservations = this.allReservations
      .filter(r =>
        r.when &&
        r.when >= startOfToday &&
        r.rawStatus !== 'CANCELLED'
      )
      .slice(0, 4);
  }

  private normalizeToList(raw: any): any[] {
    if (Array.isArray(raw)) return raw;
    if (raw && Array.isArray(raw.content)) return raw.content;
    if (raw && Array.isArray(raw.data)) return raw.data;
    if (raw && typeof raw === 'object') return [raw];
    return [];
  }

  confirmReservation(res: any): void {
    this.updateStatus(res, 'CONFIRMED');
  }

  markSeated(res: any): void {
    this.updateStatus(res, 'SEATED');
  }

  markNoShow(res: any): void {
    if (!confirm(`Mark ${res.name} as No Show?`)) return;
    this.updateStatus(res, 'NO_SHOW');
  }

  cancelReservation(res: any): void {
    if (!confirm(`Cancel ${res.name}'s reservation?`)) return;
    this.updateStatus(res, 'CANCELLED');
  }

  private updateStatus(res: any, status: string): void {
    if (!res?.id) return;

    const stored = localStorage.getItem('user');
    const userId = stored ? JSON.parse(stored).id : null;

    const previousStatus = res.rawStatus;

    res.rawStatus = status;
    res.status = this.formatStatus(status);
    this.cdr.detectChanges();

    this.api.changeReservationStatus(res.id, status, userId).subscribe({
      next: (updated: any) => {
        res.rawStatus = ((updated?.status) || status).toUpperCase();
        res.status = this.formatStatus(res.rawStatus);
        this.syncOverviewFromAll();
        this.cdr.detectChanges();
        this.refreshStats();
      },
      error: (err) => {
        console.error('[Dashboard] status update failed', err);
        res.rawStatus = previousStatus;
        res.status = this.formatStatus(previousStatus);
        this.cdr.detectChanges();
      }
    });
  }

  private refreshStats(): void {
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
      error: (err) => console.error('[Dashboard] stats refresh failed', err)
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

  resetToPending(res: any): void {
    if (!confirm('Reset this reservation back to Pending?')) return;
    this.updateStatus(res, 'PENDING');
  }

  loadTables(): void {
    if (!this.restaurantId) return;

    this.api.getTablesByRestaurant(this.restaurantId).subscribe({
      next: (raw: any) => {
        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
        this.tables = list.map((t: any) => ({
          id: t.id,
          tableNumber: t.tableNumber || '',
          minCapacity: t.minCapacity ?? 0,
          maxCapacity: t.maxCapacity ?? 0,
          status: t.status || 'Available'
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[Dashboard] tables load failed', err);
        this.tables = [];
      }
    });
  }

  openAddTable(): void {
    this.editingTable = null;
    this.tableForm = { tableNumber: '', minCapacity: 2, maxCapacity: 4, status: 'Available' };
    this.tableError = '';
    this.tableModalOpen = true;
  }

  openEditTable(table: any): void {
    this.editingTable = table;
    this.tableForm = {
      tableNumber: table.tableNumber,
      minCapacity: table.minCapacity,
      maxCapacity: table.maxCapacity,
      status: table.status || 'Available'
    };
    this.tableError = '';
    this.tableModalOpen = true;
  }

  closeTableModal(): void {
    this.tableModalOpen = false;
    this.editingTable = null;
    this.tableError = '';
  }

  saveTable(): void {
    this.tableError = '';

    if (!this.tableForm.tableNumber?.trim()) {
      this.tableError = 'Table number is required.';
      return;
    }
    if (!this.tableForm.minCapacity || this.tableForm.minCapacity < 1) {
      this.tableError = 'Minimum capacity must be at least 1.';
      return;
    }
    if (!this.tableForm.maxCapacity || this.tableForm.maxCapacity < this.tableForm.minCapacity) {
      this.tableError = 'Maximum capacity must be ≥ minimum capacity.';
      return;
    }
    if (!this.restaurantId) {
      this.tableError = 'No restaurant loaded.';
      return;
    }

    this.tableSaving = true;

    const payload = {
      tableNumber: this.tableForm.tableNumber.trim(),
      minCapacity: Number(this.tableForm.minCapacity),
      maxCapacity: Number(this.tableForm.maxCapacity),
      status: this.tableForm.status
    };

    const req = this.editingTable
      ? this.api.updateTable(this.editingTable.id, payload)
      : this.api.createTable(this.restaurantId, payload);

    req.subscribe({
      next: () => {
        this.tableSaving = false;
        this.closeTableModal();
        this.loadTables();
      },
      error: (err) => {
        this.tableSaving = false;
        this.tableError = err?.error?.message || 'Could not save the table.';
        console.error('[Dashboard] save table failed', err);
      }
    });
  }

  deleteTable(table: any): void {
    if (!confirm(`Delete table "${table.tableNumber}"?`)) return;

    this.api.deleteTable(table.id).subscribe({
      next: () => this.loadTables(),
      error: (err) => {
        console.error('[Dashboard] delete table failed', err);
        alert('Could not delete the table.');
      }
    });
  }

  loadSchedule(): void {
    if (!this.restaurantId) return;

    this.api.getHoursByRestaurant(this.restaurantId).subscribe({
      next: (raw: any) => {
        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
        const byDay = new Map<number, any>();
        list.forEach((h: any) => byDay.set(h.dayOfWeek, h));

        const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        this.schedule = [1, 2, 3, 4, 5, 6, 7].map(dow => {
          const h = byDay.get(dow);
          return {
            id: h?.id ?? null,
            dayOfWeek: dow,
            day: dayNames[dow - 1],
            open: h?.openingTime ? String(h.openingTime).substring(0, 5) : '11:00',
            close: h?.closingTime ? String(h.closingTime).substring(0, 5) : '22:00',
            original: h || null
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[Dashboard] schedule load failed', err)
    });
  }

  loadOverrides(): void {
    if (!this.restaurantId) return;

    this.api.getOverridesByRestaurant(this.restaurantId).subscribe({
      next: (raw: any) => {
        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
        this.scheduleOverrides = list.map((o: any) => {
          const isClosed = o.isClosed === true || o.closed === true || o.isClosed === 'true';
          return {
            id: o.id,
            date: o.overrideDate,
            open: o.openingTime ? String(o.openingTime).substring(0, 5) : '',
            close: o.closingTime ? String(o.closingTime).substring(0, 5) : '',
            reason: o.reason || '',
            isClosed,
            status: isClosed ? 'Closed' : 'Open'
          };
        });
        this.cdr.detectChanges();
      },
      error: (err) => console.error('[Dashboard] overrides load failed', err)
    });
  }

  saveDay(day: any): void {
    if (!this.restaurantId) return;

    this.scheduleSaving = true;
    this.scheduleError = '';

    const payload = {
      dayOfWeek: day.dayOfWeek,
      openingTime: day.isClosed ? null : (day.open + ':00'),
      closingTime: day.isClosed ? null : (day.close + ':00'),
      isClosed: false
    };

    const req = day.id
      ? this.api.updateHours(day.id, payload)
      : this.api.createHours(this.restaurantId, payload);

    req.subscribe({
      next: () => {
        this.scheduleSaving = false;
        this.showToast(`${day.day} hours saved`);
        this.loadSchedule();
      },
      error: (err) => {
        this.scheduleSaving = false;
        this.scheduleError = err?.error?.message || 'Could not save hours.';
        this.showToast(this.scheduleError, 'error');
        console.error('[Dashboard] save hours failed', err);
      }
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

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setTab(tab: 'overview' | 'reservations' | 'tables' | 'schedule' | 'reviews' | 'profile') {
    this.activeTab.set(tab);
    if (window.innerWidth < 768) this.isSidebarOpen.set(false);
  }

  openAddOverride(): void {
    this.editingOverride = null;
    this.overrideForm = {
      overrideDate: '',
      openingTime: '11:00',
      closingTime: '22:00',
      isClosed: false,
      reason: ''
    };
    this.overrideError = '';
    this.overrideModalOpen = true;
  }

  openEditOverride(o: any): void {
    this.editingOverride = o;
    this.overrideForm = {
      overrideDate: o.date,
      openingTime: o.open || '11:00',
      closingTime: o.close || '22:00',
      isClosed: o.isClosed,
      reason: o.reason || ''
    };
    this.overrideError = '';
    this.overrideModalOpen = true;
  }

  closeOverrideModal(): void {
    this.overrideModalOpen = false;
    this.editingOverride = null;
    this.overrideError = '';
  }

  saveOverride(): void {
    this.overrideError = '';

    if (!this.overrideForm.overrideDate) {
      this.overrideError = 'Date is required.';
      return;
    }
    if (!this.overrideForm.isClosed) {
      if (!this.overrideForm.openingTime || !this.overrideForm.closingTime) {
        this.overrideError = 'Opening and closing times are required.';
        return;
      }
    }
    if (!this.restaurantId) {
      this.overrideError = 'No restaurant loaded.';
      return;
    }

    this.overrideSaving = true;

    const payload: any = {
      overrideDate: this.overrideForm.overrideDate,
      isClosed: this.overrideForm.isClosed,
      reason: this.overrideForm.reason
    };
    if (!this.overrideForm.isClosed) {
      payload.openingTime = this.overrideForm.openingTime + ':00';
      payload.closingTime = this.overrideForm.closingTime + ':00';
    }

    const req = this.editingOverride
      ? this.api.updateOverride(this.editingOverride.id, payload)
      : this.api.createOverride(this.restaurantId, payload);

    req.subscribe({
      next: () => {
        this.overrideSaving = false;
        this.closeOverrideModal();
        this.loadOverrides();
      },
      error: (err) => {
        this.overrideSaving = false;
        this.overrideError = err?.error?.message || 'Could not save override.';
        console.error('[Dashboard] save override failed', err);
      }
    });
  }

  deleteOverride(o: any): void {
    if (!confirm(`Delete the override for ${o.date}?`)) return;

    this.api.deleteOverride(o.id).subscribe({
      next: () => this.loadOverrides(),
      error: (err) => {
        console.error('[Dashboard] delete override failed', err);
        alert('Could not delete the override.');
      }
    });
  }

  loadReviews(): void {
    if (!this.restaurantId) return;

    this.api.getReviewsByRestaurant(this.restaurantId)
      .then((raw: any) => {
        const list = Array.isArray(raw) ? raw : (raw?.content ?? []);
        this.reviews = list.map((r: any) => {
          const author = (r.userName || r.author || 'Anonymous').trim();
          return {
            id: r.id,
            author,
            rating: r.rating ?? 0,
            date: r.createdAt ? this.formatReviewDate(r.createdAt) : 'Recently',
            text: r.comment || r.text || 'No comment provided.',
            response: r.ownerResponse || ''
          };
        });
        this.cdr.detectChanges();
      })
      .catch((err: any) => {
        console.error('[Dashboard] reviews load failed', err);
        this.reviews = [];
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

  submitResponse(review: any): void {
    const draft = (this.reviewResponseDrafts[review.id] || '').trim();
    if (!draft) return;

    this.reviewSavingId = review.id;

    this.api.respondToReview(review.id, draft).subscribe({
      next: (updated: any) => {
        this.reviewSavingId = null;
        review.response = updated?.ownerResponse || draft;
        delete this.reviewResponseDrafts[review.id];
        this.showToast('Response saved');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reviewSavingId = null;
        console.error('[Dashboard] save response failed', err);
        this.showToast('Could not save response', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  loadProfile(): void {
    if (!this.restaurantId) return;

    this.api.getRestaurantById(this.restaurantId).then((r: any) => {
      if (!r) return;

      const storedUser = localStorage.getItem('user');
      const ownerEmail = storedUser ? JSON.parse(storedUser).email : '';

      this.profile = {
        restaurantName: r.name || '',
        address: r.address || '',
        phone: r.phone || '',
        email: r.email || ownerEmail || '',
        siret: this.profile.siret || '',
        bankAccount: this.profile.bankAccount || '',
        description: r.description || '',
        cuisineType: r.cuisineType || '',
        priceRange: r.priceRange || '',
        specialOffer: r.specialOffer || '',
        coverPhotoUrl: r.coverPhotoUrl || ''
      };
      this.cdr.detectChanges();
    }).catch((err: any) => {
      console.error('[Dashboard] profile load failed', err);
    });
  }

  saveProfile(): void {
    if (!this.restaurantId) {
      this.showToast('No restaurant loaded', 'error');
      return;
    }

    this.profileSaving = true;

    const payload: any = {
      name: this.profile.restaurantName?.trim() || '',
      address: this.profile.address?.trim() || '',
      phone: this.profile.phone?.trim() || '',
      description: this.profile.description?.trim() || '',
      cuisineType: this.profile.cuisineType?.trim() || '',
      priceRange: this.profile.priceRange?.trim() || '',
      specialOffer: this.profile.specialOffer?.trim() || '',
      coverPhotoUrl: this.profile.coverPhotoUrl?.trim() || ''
    };

    Object.keys(payload).forEach(k => {
      if (payload[k] === '') delete payload[k];
    });

    this.api.updateRestaurant(this.restaurantId, payload).subscribe({
      next: (updated: any) => {
        this.profileSaving = false;
        this.profile.restaurantName = updated.name || this.profile.restaurantName;
        this.profile.address = updated.address || this.profile.address;
        this.profile.phone = updated.phone || this.profile.phone;
        this.profile.description = updated.description || this.profile.description;
        this.profile.cuisineType = updated.cuisineType || this.profile.cuisineType;
        this.profile.priceRange = updated.priceRange || this.profile.priceRange;
        this.profile.specialOffer = updated.specialOffer || this.profile.specialOffer;
        this.profile.coverPhotoUrl = updated.coverPhotoUrl || this.profile.coverPhotoUrl;
        this.restaurant.name = updated.name || this.restaurant.name;
        this.restaurant.avatar = this.getRestaurantInitials(this.restaurant.name);

        this.showToast('Profile saved');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.profileSaving = false;
        console.error('[Dashboard] save profile failed', err);
        this.showToast('Could not save profile', 'error');
      }
    });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    this.router.navigate(['/']);
  }
}
