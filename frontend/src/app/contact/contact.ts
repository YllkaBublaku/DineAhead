import { Component, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, Header, Footer],
  templateUrl: './contact.html',
  styleUrl: './contact.css',
})
export class Contact {
  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  contactData = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  successMessage = '';
  errorMessage = '';

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
      .then((response) => {
        this.successMessage = 'Thank you for your message! Our support team will get back to you within 24 hours.';
        this.contactData = { name: '', email: '', subject: '', message: '' };
      })
      .catch((error) => {
        this.errorMessage = 'Failed to send your message. Please try again or email us directly at support@dineahead.com.';
      })
      .finally(() => {
        this.isSubmitting = false;
        this.cdr.detectChanges();
      });
  }
}
