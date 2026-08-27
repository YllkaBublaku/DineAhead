import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

@Component({
  selector: 'app-home',
  imports: [RouterLink, CommonModule, FormsModule, Header, Footer],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  constructor(private router: Router) {}

  mobileMenuOpen = false;
  searchCity = 'Paris';
  searchQuery = '';

  favorites = new Set<string>(['offer-1', 'offer-2']);

  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen = !this.mobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen = false;
  }

  toggleFavorite(id: string, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    if (this.favorites.has(id)) {
      this.favorites.delete(id);
    } else {
      this.favorites.add(id);
    }
  }

  isFavorite(id: string): boolean {
    return this.favorites.has(id);
  }

  scrollCarousel(elementId: string, offset: number): void {
    const el = document.getElementById(elementId);
    if (el) {
      el.scrollBy({ left: offset, behavior: 'smooth' });
    }
  }

  onSearch(): void {
    this.router.navigate(['/restaurants'], {
      queryParams: {
        city: this.searchCity || 'Paris',
        q: this.searchQuery || undefined,
      },
    });
  }
}

