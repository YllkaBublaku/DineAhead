import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SettingsService } from '../services/settings.service';

@Injectable({ providedIn: 'root' })
export class SignupEnabledGuard implements CanActivate {
  constructor(private router: Router, private settings: SettingsService) {}

  async canActivate(): Promise<boolean> {
    await this.settings.load();
    const userOk = this.settings.isEnabled('feature.signup.user', true);
    const restaurantOk = this.settings.isEnabled('feature.signup.restaurant', true);

    if (!userOk && !restaurantOk) {
      this.router.navigate(['/']);
      return false;
    }
    return true;
  }
}
