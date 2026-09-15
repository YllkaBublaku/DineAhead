import { Component, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-footer',
  imports: [RouterLink, CommonModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  contactEmail = '';
  contactPhone = '';
  contactAddress = '';
  restaurantSignupEnabled = true;

  constructor(private settings: SettingsService) {}

  ngOnInit(): void {
    this.settings.load().then(() => {
      const c = this.settings.contact;
      this.contactEmail = c.email || '';
      this.contactPhone = c.phone || '';
      this.contactAddress = c.address || '';

      this.restaurantSignupEnabled = this.settings.isEnabled('feature.signup.restaurant', true);
    });
  }
}
