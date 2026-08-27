import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../services/api.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-oauth-redirect',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-white dark:bg-gray-950">
      <div class="text-center">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-[#005943] border-t-transparent"></div>
        <p class="mt-4 text-gray-600 dark:text-gray-400">Completing sign in...</p>
        <p *ngIf="error" class="mt-2 text-red-600 text-sm">{{ error }}</p>
      </div>
    </div>
  `
})
export class OauthRedirectComponent implements OnInit {
  error: string | null = null;

  constructor(private router: Router, private api: ApiService) {}

  ngOnInit() {
    setTimeout(() => {
      this.api.getCurrentUser().subscribe({
        next: (user: any) => {
          console.log('OAuth redirect - user received:', user);

          if (user && user.id) {
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');

            this.router.navigate(['/']);
          } else {
            console.warn('OAuth redirect - no user found');
            this.error = 'No user data received. Please try again.';
            setTimeout(() => {
              this.router.navigate(['/login']);
            }, 2000);
          }
        },
        error: (error) => {
          console.error('OAuth redirect error:', error);
          this.error = 'Authentication failed. Please try again.';
          setTimeout(() => {
            this.router.navigate(['/login'], {
              queryParams: { error: 'oauth_failed' }
            });
          }, 2000);
        }
      });
    }, 500);
  }
}
