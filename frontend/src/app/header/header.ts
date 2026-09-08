import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';
import { filter, Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header implements OnInit, OnDestroy {
  @Input() showSearch = false;
  @Input() searchCity = 'Paris';
  @Input() searchQuery = '';
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  mobileMenuOpen = false;
  isLoggedIn = false;
  userRole: string | null = null;
  userAvatar: string | null = null;
  user: any = null;
  private routerSubscription: Subscription | null = null;

  constructor(private router: Router, private api: ApiService) {}

  ngOnInit(): void {
    this.checkLoginStatus();

    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkLoginStatus();
      });
  }

  ngOnDestroy(): void {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  checkLoginStatus(): void {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        this.user = JSON.parse(storedUser);
        this.isLoggedIn = true;
        this.userRole = this.user?.role || null;

        const first = this.user?.firstName?.charAt(0) || '';
        const last = this.user?.lastName?.charAt(0) || '';
        this.user.initials = (first + last).toUpperCase() || 'U';
      } else {
        this.isLoggedIn = false;
        this.user = null;
        this.userRole = null;
      }
    } catch (error) {
      console.error('Error checking login status:', error);
      this.isLoggedIn = false;
      this.user = null;
      this.userRole = null;
    }
  }

  private clearUserState(): void {
    this.isLoggedIn = false;
    this.user = null;
    this.userRole = null;
    this.userAvatar = null;
  }

  logout(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');
    this.clearUserState();

    window.location.href = 'http://localhost:8080/logout';
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
