import { Routes } from '@angular/router';
import {OauthRedirectComponent} from './oauth-redirect/oauth-redirect';

export const routes: Routes = [
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', loadComponent: () => import('./home/home').then(m => m.Home) },
  { path: 'restaurants', loadComponent: () => import('./restaurants/restaurants').then(m => m.Restaurants) },
  { path: 'restaurant/:id', loadComponent: () => import('./restaurant-detail/restaurant-detail').then(m => m.RestaurantDetail)},
  { path: 'similar-restaurants', loadComponent: () => import('./similar-restaurants/similar-restaurants').then(m => m.SimilarRestaurants)},
  { path: 'cities', loadComponent: () => import('./cities/cities').then(m => m.Cities)},
  { path: 'how-it-works', loadComponent: () => import('./how-it-works/how-it-works').then(m => m.HowItWorks)},
  { path: 'help', loadComponent: () => import('./help-page/help-page').then(m => m.HelpPage)},
  { path: 'dashboard', loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard)},
  { path: 'restaurant-dashboard', loadComponent: () => import('./restaurant-dashboard/restaurant-dashboard').then(m => m.RestaurantDashboard)},
  { path: 'login', loadComponent: () => import('./login/login').then(m => m.Login)},
  { path: 'signup', loadComponent: () => import('./signup/signup').then(m => m.Signup) },
  { path: 'search', redirectTo: 'restaurants', pathMatch: 'full' },
  { path: 'reset-password', loadComponent: () => import('./reset-password/reset-password').then(m => m.ResetPassword) },
  { path: 'oauth2/redirect', component: OauthRedirectComponent},
];

