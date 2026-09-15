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
  userSearch = '';
  userRoleFilter: 'all' | 'DINER' | 'RESTAURANT_OWNER' | 'PLATFORM_ADMIN' = 'all';
  userSort: 'newest' | 'name' = 'newest';
  userPage = 1;
  userPageSize = 15;

  roleModalOpen = false;
  roleModalTarget: any = null;
  roleModalNewRole = '';
  roleModalSaving = false;

  deleteUserDialogOpen = false;
  deleteUserTarget: any = null;
  deleteUserConfirmText = '';
  deleteUserLoading = false;
  deleteUserError = '';

  reservations: any[] = [];
  reservationSearch = '';
  reservationStatusFilter: 'all' | 'PENDING' | 'CONFIRMED' | 'SEATED' | 'NO_SHOW' | 'CANCELLED' = 'all';
  reservationDateFilter = '';
  reservationPage = 1;
  reservationPageSize = 15;
  viewReservationOpen = false;
  viewReservation: any = null;
  noteDraft = '';
  noteSaving = false;
  reservationActionSaving = false;

  reviews: any[] = [];
  reviewSearch = '';
  reviewRatingFilter: 'all' | '1' | '2' | '3' | '4' | '5' = 'all';
  reviewSort: 'newest' | 'rating-low' | 'rating-high' = 'newest';
  reviewPage = 1;
  reviewPageSize = 15;

  deleteReviewDialogOpen = false;
  deleteReviewTarget: any = null;
  deleteReviewConfirmText = '';
  deleteReviewLoading = false;
  deleteReviewError = '';

  cities: any[] = [];
  citySearch = '';
  citySort: 'name' | 'newest' = 'name';
  cityPage = 1;
  cityPageSize = 15;

  cityModalOpen = false;
  cityModalMode: 'create' | 'edit' = 'create';
  cityModalTarget: any = null;
  cityModalForm = { name: '', imageUrl: '', country: '' };
  cityModalSaving = false;
  cityModalError = '';

  deleteCityDialogOpen = false;
  deleteCityTarget: any = null;
  deleteCityConfirmText = '';
  deleteCityLoading = false;
  deleteCityError = '';

  settings: Record<string, string> = {};

  announcementSaving = false;
  maintenanceSaving = false;
  contactSaving = false;

  announcementMessage = '';
  announcementType: 'off' | 'info' | 'warning' = 'off';

  maintenanceEnabled = false;
  maintenanceMessage = '';

  contactEmail = '';
  contactPhone = '';
  contactAddress = '';

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
    if (tab === 'settings') this.loadSettings();
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
      next: (raw: any) => {
        console.log('[admin] raw users:', raw);

        let list: any[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.content)) {
          list = raw.content;
        } else if (raw && Array.isArray(raw.data)) {
          list = raw.data;
        }

        this.users = list;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] users failed', err);
        this.showToast('Could not load users', 'error');
      }
    });
  }

  get filteredUsers(): any[] {
    let list = [...this.users];

    if (this.userRoleFilter !== 'all') {
      list = list.filter(u => (u.role || '').toUpperCase().replace(/^ROLE_/, '') === this.userRoleFilter);
    }

    const q = this.userSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(u =>
        ((u.firstName || '') + ' ' + (u.lastName || '')).toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    }

    if (this.userSort === 'name') {
      list.sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''));
    } else {
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    }
    return list;
  }

  get pagedUsers(): any[] {
    const start = (this.userPage - 1) * this.userPageSize;
    return this.filteredUsers.slice(start, start + this.userPageSize);
  }

  get userTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredUsers.length / this.userPageSize));
  }

  userNextPage() { if (this.userPage < this.userTotalPages) this.userPage++; }
  userPrevPage() { if (this.userPage > 1) this.userPage--; }

  userInitials(u: any): string {
    const f = (u.firstName || '').charAt(0);
    const l = (u.lastName || '').charAt(0);
    return (f + l).toUpperCase() || 'U';
  }

  roleLabel(role: string): string {
    const r = (role || '').toUpperCase().replace(/^ROLE_/, '');
    if (r === 'PLATFORM_ADMIN') return 'Admin';
    if (r === 'RESTAURANT_OWNER') return 'Owner';
    if (r === 'DINER') return 'Diner';
    return r || '—';
  }

  roleClass(role: string): string {
    const r = (role || '').toUpperCase().replace(/^ROLE_/, '');
    if (r === 'PLATFORM_ADMIN') return 'bg-[#0f172a] text-white';
    if (r === 'RESTAURANT_OWNER') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }

  openRoleModal(u: any): void {
    this.roleModalTarget = u;
    this.roleModalNewRole = (u.role || 'USER').toUpperCase().replace(/^ROLE_/, '');
    this.roleModalOpen = true;
    this.cdr.detectChanges();
  }

  closeRoleModal(): void {
    this.roleModalOpen = false;
    this.roleModalTarget = null;
    this.roleModalNewRole = '';
    this.cdr.detectChanges();
  }

  saveRole(): void {
    if (!this.roleModalTarget || !this.roleModalNewRole) return;

    this.roleModalSaving = true;

    this.api.adminChangeUserRole(this.roleModalTarget.id, this.roleModalNewRole).subscribe({
      next: () => {
        this.roleModalSaving = false;

        const idx = this.users.findIndex(u => u.id === this.roleModalTarget.id);
        if (idx !== -1) {
          this.users[idx] = { ...this.users[idx], role: this.roleModalNewRole };
          this.users = [...this.users];
        }

        this.showToast('Role updated');
        this.closeRoleModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.roleModalSaving = false;
        console.error('[admin] change role failed', err);
        this.showToast('Could not change role', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteUser(u: any): void {
    this.deleteUserTarget = u;
    this.deleteUserConfirmText = '';
    this.deleteUserError = '';
    this.deleteUserLoading = false;
    this.deleteUserDialogOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteUser(): void {
    this.deleteUserDialogOpen = false;
    this.deleteUserTarget = null;
    this.cdr.detectChanges();
  }

  confirmDeleteUser(): void {
    if (!this.deleteUserTarget) return;

    if (this.deleteUserConfirmText.trim().toUpperCase() !== 'DELETE') {
      this.deleteUserError = 'Please type DELETE to confirm.';
      return;
    }

    this.deleteUserLoading = true;
    this.deleteUserError = '';

    this.api.adminDeleteUser(this.deleteUserTarget.id).subscribe({
      next: () => {
        this.deleteUserLoading = false;
        this.deleteUserDialogOpen = false;
        this.users = this.users.filter(u => u.id !== this.deleteUserTarget.id);
        this.showToast('User deleted');
        this.deleteUserTarget = null;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteUserLoading = false;
        console.error('[admin] delete user failed', err);
        this.deleteUserError = err?.error?.message || 'Could not delete user.';
        this.cdr.detectChanges();
      }
    });
  }

  loadReservations(): void {
    this.api.getAdminReservations().subscribe({
      next: (raw: any) => {
        let list: any[] = [];
        if (Array.isArray(raw)) {
          list = raw;
        } else if (raw && Array.isArray(raw.content)) {
          list = raw.content;
        } else if (raw && Array.isArray(raw.data)) {
          list = raw.data;
        } else {
          console.warn('[admin] unexpected reservations shape:', raw);
        }

        this.reservations = list.map(r => ({
          id: r.id,
          reservationDate: r.reservationDate || '',
          reservationTime: r.reservationTime ? String(r.reservationTime).substring(0, 5) : '',
          partySize: r.partySize ?? 0,
          status: (r.status || 'PENDING').toUpperCase(),
          specialRequests: r.specialRequests || '',
          restaurantId: r.restaurant?.id ?? r.restaurantId ?? null,
          restaurantName: r.restaurant?.name || r.restaurantName || 'Restaurant',
          customerName: r.user
            ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim()
            : (r.customerName || 'Guest'),
          customerEmail: r.user?.email || r.customerEmail || '',
          customerPhone: r.user?.phone || r.customerPhone || '',
          customerId: r.user?.id ?? r.userId ?? null,
          tableNumber: r.tableNumber ?? r.table?.tableNumber ?? null,
          depositPaid: r.depositPaid === true,
          depositAmount: r.depositAmount ?? 0,
          adminNote: r.adminNote || '',
          adminNoteUpdatedAt: r.adminNoteUpdatedAt || null,
          createdAt: r.createdAt || null
        }));

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] reservations failed', err);
        this.showToast('Could not load reservations', 'error');
      }
    });
  }

  get filteredReservations(): any[] {
    let list = [...this.reservations];

    if (this.reservationStatusFilter !== 'all') {
      list = list.filter(r => (r.status || '').toUpperCase() === this.reservationStatusFilter);
    }

    if (this.reservationDateFilter) {
      list = list.filter(r => (r.reservationDate || '').startsWith(this.reservationDateFilter));
    }

    const q = this.reservationSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.restaurantName || '').toLowerCase().includes(q) ||
        (r.customerName || '').toLowerCase().includes(q) ||
        (r.customerEmail || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => {
      const da = `${a.reservationDate || ''}T${a.reservationTime || ''}`;
      const db = `${b.reservationDate || ''}T${b.reservationTime || ''}`;
      return db.localeCompare(da);
    });
    return list;
  }

  get pagedReservations(): any[] {
    const start = (this.reservationPage - 1) * this.reservationPageSize;
    return this.filteredReservations.slice(start, start + this.reservationPageSize);
  }

  get reservationTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReservations.length / this.reservationPageSize));
  }

  reservationNextPage() { if (this.reservationPage < this.reservationTotalPages) this.reservationPage++; }
  reservationPrevPage() { if (this.reservationPage > 1) this.reservationPage--; }

  statusClass(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'CONFIRMED') return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400';
    if (s === 'PENDING') return 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400';
    if (s === 'SEATED') return 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400';
    if (s === 'NO_SHOW' || s === 'CANCELLED') return 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400';
    return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
  }

  statusLabel(status: string): string {
    const s = (status || '').toUpperCase();
    if (s === 'NO_SHOW') return 'No Show';
    if (!s) return '—';
    return s.charAt(0) + s.slice(1).toLowerCase();
  }

  openReservationDetails(r: any): void {
    this.viewReservation = r;
    this.noteDraft = r.adminNote || '';
    this.viewReservationOpen = true;
    this.cdr.detectChanges();
  }

  closeReservationDetails(): void {
    this.viewReservationOpen = false;
    this.viewReservation = null;
    this.noteDraft = '';
    this.cdr.detectChanges();
  }

  changeReservationStatus(r: any, newStatus: string): void {
    if (!r || !newStatus) return;
    if ((r.status || '').toUpperCase() === newStatus.toUpperCase()) return;

    const prev = r.status;
    r.status = newStatus.toUpperCase();
    this.reservationActionSaving = true;

    this.api.adminChangeReservationStatus(r.id, newStatus.toUpperCase()).subscribe({
      next: (updated: any) => {
        this.reservationActionSaving = false;

        if (updated && updated.status) {
          r.status = String(updated.status).toUpperCase();
        }

        if (this.viewReservation && this.viewReservation.id === r.id) {
          this.viewReservation = { ...this.viewReservation, status: r.status };
        }

        this.showToast(`Status changed to ${this.statusLabel(r.status)}`);
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reservationActionSaving = false;
        r.status = prev;
        console.error('[admin] status change failed', err);
        this.showToast('Could not change status', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  forceCancelReservation(r: any): void {
    if (!r) return;

    const ok = confirm(
      `Force-cancel reservation for ${r.customerName} at ${r.restaurantName}?\n\n` +
      `Date: ${r.reservationDate} ${r.reservationTime}\n` +
      `Party: ${r.partySize}`
    );
    if (!ok) return;

    this.reservationActionSaving = true;

    this.api.adminCancelReservation(r.id).subscribe({
      next: (updated: any) => {
        this.reservationActionSaving = false;
        r.status = 'CANCELLED';

        if (this.viewReservation && this.viewReservation.id === r.id) {
          this.viewReservation = { ...this.viewReservation, status: 'CANCELLED' };
        }

        this.showToast('Reservation cancelled');
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.reservationActionSaving = false;
        console.error('[admin] cancel failed', err);
        this.showToast('Could not cancel reservation', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  saveAdminNote(): void {
    if (!this.viewReservation) return;

    this.noteSaving = true;

    this.api.adminUpdateReservationNote(this.viewReservation.id, this.noteDraft).subscribe({
      next: (updated: any) => {
        this.noteSaving = false;

        const newNote = updated?.adminNote ?? this.noteDraft;
        const newStamp = updated?.adminNoteUpdatedAt ?? new Date().toISOString();

        this.viewReservation.adminNote = newNote;
        this.viewReservation.adminNoteUpdatedAt = newStamp;

        const idx = this.reservations.findIndex(r => r.id === this.viewReservation.id);
        if (idx !== -1) {
          this.reservations[idx].adminNote = newNote;
          this.reservations[idx].adminNoteUpdatedAt = newStamp;
          this.reservations = [...this.reservations];
        }

        this.showToast('Note saved');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.noteSaving = false;
        console.error('[admin] note save failed', err);
        this.showToast('Could not save note', 'error');
        this.cdr.detectChanges();
      }
    });
  }

  readonly reservationStatuses: string[] = [
    'PENDING', 'CONFIRMED', 'SEATED', 'NO_SHOW', 'CANCELLED'
  ];

  loadReviews(): void {
    this.api.getAdminReviews().subscribe({
      next: (raw: any) => {
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && Array.isArray(raw.content)) list = raw.content;
        else if (raw && Array.isArray(raw.data)) list = raw.data;

        this.reviews = list.map(r => ({
          id: r.id,
          rating: r.rating ?? 0,
          foodRating: r.foodRating ?? null,
          serviceRating: r.serviceRating ?? null,
          ambianceRating: r.ambianceRating ?? null,
          comment: r.comment || '',
          createdAt: r.createdAt || null,
          ownerResponse: r.ownerResponse || '',
          helpfulCount: r.helpfulCount ?? 0,
          authorName: r.userName
            || (r.user ? `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() : '')
            || 'Anonymous',
          authorEmail: r.user?.email || r.userEmail || '',
          authorId: r.user?.id ?? r.userId ?? null,
          restaurantId: r.restaurant?.id ?? r.restaurantId ?? null,
          restaurantName: r.restaurant?.name || r.restaurantName || 'Restaurant'
        }));

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] reviews failed', err);
        this.showToast('Could not load reviews', 'error');
      }
    });
  }

  get filteredReviews(): any[] {
    let list = [...this.reviews];

    if (this.reviewRatingFilter !== 'all') {
      const target = Number(this.reviewRatingFilter);
      list = list.filter(r => Math.floor(r.rating) === target);
    }

    const q = this.reviewSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(r =>
        (r.authorName || '').toLowerCase().includes(q) ||
        (r.authorEmail || '').toLowerCase().includes(q) ||
        (r.restaurantName || '').toLowerCase().includes(q) ||
        (r.comment || '').toLowerCase().includes(q)
      );
    }

    switch (this.reviewSort) {
      case 'rating-low':
        list.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'rating-high':
        list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
      default:
        list.sort((a, b) => {
          const da = a.createdAt || '';
          const db = b.createdAt || '';
          return db.localeCompare(da);
        });
        break;
    }
    return list;
  }

  get pagedReviews(): any[] {
    const start = (this.reviewPage - 1) * this.reviewPageSize;
    return this.filteredReviews.slice(start, start + this.reviewPageSize);
  }

  get reviewTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredReviews.length / this.reviewPageSize));
  }

  reviewNextPage() { if (this.reviewPage < this.reviewTotalPages) this.reviewPage++; }
  reviewPrevPage() { if (this.reviewPage > 1) this.reviewPage--; }

  reviewAuthorInitials(r: any): string {
    const name = (r.authorName || 'A').trim();
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 0) return 'A';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  ratingStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }

  openDeleteReview(r: any): void {
    this.deleteReviewTarget = r;
    this.deleteReviewConfirmText = '';
    this.deleteReviewError = '';
    this.deleteReviewLoading = false;
    this.deleteReviewDialogOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteReview(): void {
    this.deleteReviewDialogOpen = false;
    this.deleteReviewTarget = null;
    this.cdr.detectChanges();
  }

  confirmDeleteReview(): void {
    if (!this.deleteReviewTarget) return;

    if (this.deleteReviewConfirmText.trim().toUpperCase() !== 'DELETE') {
      this.deleteReviewError = 'Please type DELETE to confirm.';
      return;
    }

    this.deleteReviewLoading = true;
    this.deleteReviewError = '';

    this.api.adminDeleteReview(this.deleteReviewTarget.id).subscribe({
      next: () => {
        this.deleteReviewLoading = false;
        this.deleteReviewDialogOpen = false;
        this.reviews = this.reviews.filter(r => r.id !== this.deleteReviewTarget.id);
        this.showToast('Review deleted');
        this.deleteReviewTarget = null;
        this.loadStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteReviewLoading = false;
        console.error('[admin] delete review failed', err);
        this.deleteReviewError = err?.error?.message || 'Could not delete review.';
        this.cdr.detectChanges();
      }
    });
  }

  loadCities(): void {
    this.api.getCities()
      .then((raw: any) => {
        let list: any[] = [];
        if (Array.isArray(raw)) list = raw;
        else if (raw && Array.isArray(raw.content)) list = raw.content;
        else if (raw && Array.isArray(raw.data)) list = raw.data;

        this.cities = list.map(c => ({
          id: c.id,
          name: c.name || '',
          country: c.country || '',
          countryFlag: c.countryFlag || '',
          imageUrl: c.imageUrl || '',
          restaurantCount: c.restaurantCount ?? 0
        }));

        this.cdr.detectChanges();
      })
      .catch((err) => {
        console.error('[admin] cities failed', err);
        this.showToast('Could not load cities', 'error');
      });
  }

  get filteredCities(): any[] {
    let list = [...this.cities];

    const q = this.citySearch.trim().toLowerCase();
    if (q) {
      list = list.filter(c =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.country || '').toLowerCase().includes(q)
      );
    }

    if (this.citySort === 'newest') {
      list.sort((a, b) => (b.id || 0) - (a.id || 0));
    } else {
      list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    }
    return list;
  }

  get pagedCities(): any[] {
    const start = (this.cityPage - 1) * this.cityPageSize;
    return this.filteredCities.slice(start, start + this.cityPageSize);
  }

  get cityTotalPages(): number {
    return Math.max(1, Math.ceil(this.filteredCities.length / this.cityPageSize));
  }

  cityNextPage() { if (this.cityPage < this.cityTotalPages) this.cityPage++; }
  cityPrevPage() { if (this.cityPage > 1) this.cityPage--; }

  openCreateCity(): void {
    this.cityModalMode = 'create';
    this.cityModalTarget = null;
    this.cityModalForm = { name: '', imageUrl: '', country: '' };
    this.cityModalError = '';
    this.cityModalSaving = false;
    this.cityModalOpen = true;
    this.cdr.detectChanges();
  }

  openEditCity(c: any): void {
    this.cityModalMode = 'edit';
    this.cityModalTarget = c;
    this.cityModalForm = {
      name: c.name || '',
      imageUrl: c.imageUrl || '',
      country: c.country || ''
    };
    this.cityModalError = '';
    this.cityModalSaving = false;
    this.cityModalOpen = true;
    this.cdr.detectChanges();
  }

  closeCityModal(): void {
    this.cityModalOpen = false;
    this.cityModalTarget = null;
    this.cityModalError = '';
    this.cdr.detectChanges();
  }

  saveCity(): void {
    if (!this.cityModalForm.name.trim()) {
      this.cityModalError = 'City name is required.';
      return;
    }

    this.cityModalSaving = true;
    this.cityModalError = '';

    const payload = {
      name: this.cityModalForm.name.trim(),
      imageUrl: this.cityModalForm.imageUrl.trim(),
      country: this.cityModalForm.country.trim()
    };

    const req = this.cityModalMode === 'create'
      ? this.api.createCity(payload)
      : this.api.updateCity(this.cityModalTarget.id, payload);

    req.subscribe({
      next: (result: any) => {
        this.cityModalSaving = false;

        if (this.cityModalMode === 'create') {
          this.cities = [result, ...this.cities];
          this.showToast('City created');
        } else {
          const idx = this.cities.findIndex(c => c.id === this.cityModalTarget.id);
          if (idx !== -1) {
            this.cities[idx] = { ...this.cities[idx], ...result };
            this.cities = [...this.cities];
          }
          this.showToast('City updated');
        }

        this.closeCityModal();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.cityModalSaving = false;
        console.error('[admin] save city failed', err);
        this.cityModalError = err?.error?.message || 'Could not save city.';
        this.cdr.detectChanges();
      }
    });
  }

  openDeleteCity(c: any): void {
    this.deleteCityTarget = c;
    this.deleteCityConfirmText = '';
    this.deleteCityError = '';
    this.deleteCityLoading = false;
    this.deleteCityDialogOpen = true;
    this.cdr.detectChanges();
  }

  closeDeleteCity(): void {
    this.deleteCityDialogOpen = false;
    this.deleteCityTarget = null;
    this.cdr.detectChanges();
  }

  confirmDeleteCity(): void {
    if (!this.deleteCityTarget) return;

    if (this.deleteCityConfirmText.trim().toUpperCase() !== 'DELETE') {
      this.deleteCityError = 'Please type DELETE to confirm.';
      return;
    }

    this.deleteCityLoading = true;
    this.deleteCityError = '';

    this.api.deleteCity(this.deleteCityTarget.id).subscribe({
      next: () => {
        this.deleteCityLoading = false;
        this.deleteCityDialogOpen = false;
        this.cities = this.cities.filter(c => c.id !== this.deleteCityTarget.id);
        this.showToast('City deleted');
        this.deleteCityTarget = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.deleteCityLoading = false;
        console.error('[admin] delete city failed', err);
        this.deleteCityError = err?.error?.message || 'Could not delete city.';
        this.cdr.detectChanges();
      }
    });
  }

  loadSettings(): void {
    this.api.getAdminSettings().subscribe({
      next: (s: Record<string, string>) => {
        this.settings = s || {};

        this.announcementMessage = this.settings['announcement.message'] ?? '';
        this.announcementType = (this.settings['announcement.type'] as any) || 'off';

        this.maintenanceEnabled = this.settings['maintenance.enabled'] === 'true';
        this.maintenanceMessage = this.settings['maintenance.message'] ?? '';

        this.contactEmail = this.settings['contact.email'] ?? '';
        this.contactPhone = this.settings['contact.phone'] ?? '';
        this.contactAddress = this.settings['contact.address'] ?? '';

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[admin] settings failed', err);
        this.showToast('Could not load settings', 'error');
      }
    });
  }

  saveAnnouncement(): void {
    this.announcementSaving = true;
    this.api.updateAdminSettings({
      'announcement.message': this.announcementMessage,
      'announcement.type': this.announcementType
    }).subscribe({
      next: (s) => {
        this.announcementSaving = false;
        this.settings = s || this.settings;
        this.showToast('Announcement saved');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.announcementSaving = false;
        console.error('[admin] save announcement failed', err);
        this.showToast('Could not save announcement', 'error');
      }
    });
  }

  saveMaintenance(): void {
    this.maintenanceSaving = true;
    this.api.updateAdminSettings({
      'maintenance.enabled': this.maintenanceEnabled ? 'true' : 'false',
      'maintenance.message': this.maintenanceMessage
    }).subscribe({
      next: (s) => {
        this.maintenanceSaving = false;
        this.settings = s || this.settings;
        this.showToast('Maintenance settings saved');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.maintenanceSaving = false;
        console.error('[admin] save maintenance failed', err);
        this.showToast('Could not save maintenance', 'error');
      }
    });
  }

  saveContact(): void {
    this.contactSaving = true;
    this.api.updateAdminSettings({
      'contact.email': this.contactEmail,
      'contact.phone': this.contactPhone,
      'contact.address': this.contactAddress
    }).subscribe({
      next: (s) => {
        this.contactSaving = false;
        this.settings = s || this.settings;
        this.showToast('Contact info saved');
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.contactSaving = false;
        console.error('[admin] save contact failed', err);
        this.showToast('Could not save contact info', 'error');
      }
    });
  }

  featureFlagKeys: { key: string; label: string; description: string; defaultOn: boolean }[] = [
    { key: 'feature.reservations',       label: 'Reservations',            description: 'Allow users to book tables',           defaultOn: true  },
    { key: 'feature.reviews',            label: 'Reviews',                 description: 'Allow users to write reviews',         defaultOn: true  },
    { key: 'feature.deposits',           label: 'Deposits',                description: 'Allow restaurants to require deposits', defaultOn: false },
    { key: 'feature.favorites',          label: 'Favorites',               description: 'Allow users to save restaurants',      defaultOn: true  },
    { key: 'feature.signup.user',        label: 'New User Signups',        description: 'Allow new diner accounts',             defaultOn: true  },
    { key: 'feature.signup.restaurant',  label: 'New Restaurant Signups',  description: 'Allow new restaurant registrations',   defaultOn: true  }
  ];

  isFeatureOn(key: string): boolean {
    const val = this.settings[key];
    if (val === undefined) return false;
    return val === 'true';
  }

  toggleFeatureFlag(flagKey: string, enabled: boolean, defaultOn: boolean): void {
    const prev = this.settings[flagKey];
    this.settings = { ...this.settings, [flagKey]: enabled ? 'true' : 'false' };
    this.cdr.detectChanges();

    this.api.updateAdminSettings({ [flagKey]: enabled ? 'true' : 'false' }).subscribe({
      next: (s) => {
        this.settings = s || this.settings;
        this.showToast(`${flagKey} ${enabled ? 'enabled' : 'disabled'}`);
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.settings = { ...this.settings, [flagKey]: prev };
        console.error('[admin] toggle flag failed', err);
        this.showToast('Could not update flag', 'error');
        this.cdr.detectChanges();
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
