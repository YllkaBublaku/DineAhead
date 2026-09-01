import { Component, signal, OnInit } from '@angular/core';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  email = '';
  password = '';
  rememberMe = false;
  showPassword = signal(false);
  isLoading = signal(false);
  errorMessage = signal('');

  forgotModalOpen = signal(false);
  forgotEmail = '';
  forgotLoading = signal(false);
  forgotSuccessMessage = signal('');
  forgotErrorMessage = signal('');

  constructor(private router: Router, private api: ApiService, private route: ActivatedRoute) {}

  ngOnInit() {
    const savedEmail = localStorage.getItem('rememberedEmail');
    if (savedEmail) {
      this.email = savedEmail;
      this.rememberMe = true;
    }
  }

  toggleShowPassword() {
    this.showPassword.update(val => !val);
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  }

  loginUser() {
    this.errorMessage.set('');

    if (!this.email.trim() || !this.password.trim()) {
      this.errorMessage.set('Please enter both email and password.');
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage.set('Please enter a valid email address (e.g., name@example.com).');
      return;
    }

    this.isLoading.set(true);

    const loginData = {
      email: this.email,
      passwordHash: this.password
    };

    this.api.loginUser(loginData).subscribe({
      next: (response: any) => {
        this.isLoading.set(false);
        localStorage.setItem('user', JSON.stringify(response));
        localStorage.setItem('isLoggedIn', 'true');

        if (this.rememberMe) {
          localStorage.setItem('rememberedEmail', this.email);
        } else {
          localStorage.removeItem('rememberedEmail');
        }

        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
        if (returnUrl === '/') {
          if (response.role === 'ADMIN') {
            this.router.navigate(['/']);
          } else {
            this.router.navigate(['/']);
          }
        } else {
          this.router.navigate([returnUrl]);
        }
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || 'Invalid email or password.');
      }
    });
  }

  openForgotModal() {
    this.forgotEmail = this.email;
    this.forgotErrorMessage.set('');
    this.forgotSuccessMessage.set('');
    this.forgotModalOpen.set(true);
  }

  closeForgotModal() {
    this.forgotModalOpen.set(false);
  }

  submitForgotPassword() {
    this.forgotLoading.set(true);
    this.forgotErrorMessage.set('');
    this.forgotSuccessMessage.set('');

    if (!this.forgotEmail.trim() || !this.isValidEmail(this.forgotEmail)) {
      this.forgotLoading.set(false);
      this.forgotErrorMessage.set('Please enter a valid email address.');
      return;
    }

    this.api.requestPasswordReset({ email: this.forgotEmail }).subscribe({
      next: (response: any) => {
        this.forgotLoading.set(false);
        this.forgotSuccessMessage.set(response.message);
      },
      error: (error) => {
        this.forgotLoading.set(false);
        this.forgotErrorMessage.set(error.error?.message || 'Could not send reset link.');
      }
    });
  }

  signInWithGoogle() {
    localStorage.removeItem('user');
    localStorage.removeItem('isLoggedIn');

    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      const eqPos = cookie.indexOf('=');
      const name = eqPos > -1 ? cookie.substr(0, eqPos) : cookie;
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    }

    window.location.href = 'http://localhost:8080/oauth2/authorization/google?prompt=select_account';
  }

}
