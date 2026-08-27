import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './signup.html',
  styleUrl: './signup.css'
})
export class Signup {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  restaurantName = '';

  accountType = signal<'user' | 'restaurant'>('user');
  isLoading = signal(false);
  showPassword = signal(false);
  errorMessage = signal('');

  constructor(private router: Router, private api: ApiService) {}

  toggleShowPassword() {
    this.showPassword.update(val => !val);
  }

  setAccountType(type: 'user' | 'restaurant') {
    this.accountType.set(type);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  signUp() {
    this.errorMessage.set('');

    if (!this.firstName.trim() || !this.lastName.trim()) {
      this.errorMessage.set('Please enter both first and last name.');
      return;
    }

    if (this.accountType() === 'restaurant' && !this.restaurantName.trim()) {
      this.errorMessage.set('Please enter your restaurant name.');
      return;
    }

    if (!this.email.trim()) {
      this.errorMessage.set('Please enter your email address.');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage.set('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    if (this.password.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters long.');
      return;
    }

    const hasUpperCase = /[A-Z]/.test(this.password);
    const hasLowerCase = /[a-z]/.test(this.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.password);

    if (!hasUpperCase || !hasLowerCase) {
      this.errorMessage.set('Password must include both uppercase and lowercase letters.');
      return;
    }

    if (!hasSpecialChar) {
      this.errorMessage.set('Password must include at least one special character (e.g., !@#).');
      return;
    }

    this.isLoading.set(true);

    const userData: any = {
      firstName: this.firstName,
      lastName: this.lastName,
      email: this.email,
      passwordHash: this.password,
      role: this.accountType() === 'restaurant' ? 'ADMIN' : 'DINER'
    };

    if (this.accountType() === 'restaurant') {
      userData.restaurantName = this.restaurantName;
      this.api.registerRestaurant(userData).subscribe({
        next: (response) => {
          this.isLoading.set(false);

          localStorage.setItem('user', JSON.stringify(response));
          localStorage.setItem('isLoggedIn', 'true');

          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
        }
      });
    } else {
      this.api.registerUser(userData).subscribe({
        next: (response) => {
          this.isLoading.set(false);

          localStorage.setItem('user', JSON.stringify(response));
          localStorage.setItem('isLoggedIn', 'true');

          this.router.navigate(['/']);
        },
        error: (error) => {
          this.isLoading.set(false);
          this.errorMessage.set(error.error?.message || 'Registration failed. Please try again.');
        }
      });
    }
  }

  signUpWithGoogle() {
    localStorage.clear();
    sessionStorage.clear();

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }

    this.api.logout().subscribe({
      complete: () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google?prompt=select_account';
      },
      error: () => {
        window.location.href = 'http://localhost:8080/oauth2/authorization/google?prompt=select_account';
      }
    });
  }
}
