import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../services/api.service';

type AdminTab = 'overview' | 'restaurants' | 'users' | 'reservations' | 'reviews' | 'settings';

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
    if (!stored) {
      this.router.navigate(['/']);
      return;
    }

    const u = JSON.parse(stored);

    if ((u.role || '').toUpperCase() !== 'PLATFORM_ADMIN') {
      this.router.navigate(['/']);
      return;
    }

    const first = u.firstName || '';
    const last = u.lastName || '';

    this.user = {
      firstName: first,
      lastName: last,
      email: u.email || '',
      joined: u.createdAt ? new Date(u.createdAt).getFullYear().toString() : '',
      avatar: ((first.charAt(0) || '') + (last.charAt(0) || '')).toUpperCase() || 'A'
    };
  }

  toggleSidebar() {
    this.isSidebarOpen.update(v => !v);
  }

  setTab(tab: AdminTab) {
    this.activeTab.set(tab);
    if (window.innerWidth < 1024) this.isSidebarOpen.set(false);
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
