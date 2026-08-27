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
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (localUser.id) {
      this.isLoggedIn = true;
      this.user = localUser;
      this.userRole = localUser.role;
      this.userAvatar = null;
      return;
    }

    this.api.getCurrentUser().subscribe({
      next: (user: any) => {
        if (user) {
          this.isLoggedIn = true;
          this.user = user;
          this.userRole = user.role;
          this.userAvatar = null;

          localStorage.setItem('user', JSON.stringify(user));
          localStorage.setItem('isLoggedIn', 'true');
        }
      },
      error: (err) => {
        this.isLoggedIn = false;
        this.user = null;
        this.userAvatar = null;
      }
    });
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
