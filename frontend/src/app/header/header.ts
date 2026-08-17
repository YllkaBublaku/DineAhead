import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './header.html',
  styleUrl: './header.css',
})
export class Header {
  @Input() showSearch = false;
  @Input() searchCity = 'Paris';
  @Input() searchQuery = '';
  @Output() search = new EventEmitter<{ city: string; query: string }>();

  mobileMenuOpen = false;

  constructor(private router: Router) {}

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
