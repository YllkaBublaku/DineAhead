import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, Header, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact implements OnInit {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private settings: SettingsService
  ) {}

  contactData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  contactEmail = '';
  contactPhone = '';
  contactAddress = '';

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.settings.load().then(() => {
      const c = this.settings.contact;
      this.contactEmail = c.email || 'yllkabublaku@gmail.com';
      this.contactPhone = c.phone || '';
      this.contactAddress = c.address || '';
      this.cdr.detectChanges();
    });
  }

  submitContact(): void {
    if (!this.contactData.name || !this.contactData.email || !this.contactData.message) {
      this.errorMessage = 'Please fill in all required fields.';
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.cdr.detectChanges();

    this.api.submitContact(this.contactData)
      .then(() => {
        this.successMessage = 'Thank you for your message! Our support team will get back to you within 24 hours.';
        this.contactData = { name: '', email: '', subject: '', message: '' };
      })
      .catch(() => {
        this.errorMessage = `Failed to send your message. Please try again or email us directly at ${this.contactEmail || 'yllkabublaku@gmail.com'}.`;
      })
      .finally(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      });
  }
}
