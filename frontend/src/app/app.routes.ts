import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home').then(m => m.Home) },
  { path: 'restaurants', loadComponent: () => import('./restaurants/restaurants').then(m => m.Restaurants) },
  { path: 'restaurant/:id', loadComponent: () => import('./restaurant-detail/restaurant-detail').then(m => m.RestaurantDetail)},
  { path: 'search', redirectTo: 'restaurants', pathMatch: 'full' },
];

