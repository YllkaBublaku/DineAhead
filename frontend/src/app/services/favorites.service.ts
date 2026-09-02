import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface FavoriteItem {
  id: number;
  name: string;
  coverPhotoUrl: string;
  cuisineType: string;
  priceRange: string;
  averageRating: number;
  reviewCount: number;
  address: string;
  city: string;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritesService {
  private readonly STORAGE_KEY = 'dineahead_favorites';
  private favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);
  favorites$ = this.favoritesSubject.asObservable();

  constructor() {
    this.loadFavorites();
  }

  private loadFavorites(): void {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        const favorites = JSON.parse(stored);
        this.favoritesSubject.next(favorites);
      } catch (e) {
        console.error('Error loading favorites:', e);
        this.favoritesSubject.next([]);
      }
    }
  }

  private saveFavorites(favorites: FavoriteItem[]): void {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(favorites));
    this.favoritesSubject.next(favorites);
  }

  toggleFavorite(restaurant: FavoriteItem): boolean {
    const currentFavorites = this.favoritesSubject.value;
    const exists = currentFavorites.some(f => f.id === restaurant.id);

    let newFavorites: FavoriteItem[];
    if (exists) {
      newFavorites = currentFavorites.filter(f => f.id !== restaurant.id);
    } else {
      newFavorites = [...currentFavorites, restaurant];
    }

    this.saveFavorites(newFavorites);
    return !exists;
  }

  isFavorite(restaurantId: number): boolean {
    return this.favoritesSubject.value.some(f => f.id === restaurantId);
  }

  getFavorites(): FavoriteItem[] {
    return this.favoritesSubject.value;
  }

  getFavoriteIds(): Set<number> {
    return new Set(this.favoritesSubject.value.map(f => f.id));
  }

  clearFavorites(): void {
    this.saveFavorites([]);
  }
}
