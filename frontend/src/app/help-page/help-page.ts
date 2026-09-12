import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Header } from '../header/header';
import { Footer } from '../footer/footer';

interface Faq {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

@Component({
  selector: 'app-help-page',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, Header, Footer],
  templateUrl: './help-page.html',
  styleUrl: './help-page.css',
})
export class HelpPage {
  openFaq: string | null = null;
  searchQuery: string = '';

  faqs: Faq[] = [

    {
      id: 'booking',
      question: 'How do I book a table?',
      category: 'booking',
      answer: 'Simply search for your desired city or restaurant, choose your date, time, and party size, then click "Book a table". You will receive an instant confirmation via email and in your DineAhead account.'
    },
    {
      id: 'booking-time',
      question: 'Can I book a table for the same day?',
      category: 'booking',
      answer: 'Yes! You can book a table up to 2 hours before the reservation time, subject to availability. We recommend booking in advance for popular restaurants.'
    },
    {
      id: 'group-booking',
      question: 'Can I book for a large group?',
      category: 'booking',
      answer: 'Yes! For reservations larger than 8 people, please contact the restaurant directly via their phone number listed on their page, or use our group booking form to get a tailored offer.'
    },
    {
      id: 'special-requests',
      question: 'Can I add special requests to my booking?',
      category: 'booking',
      answer: 'Yes! When making a booking, you can add special requests such as dietary requirements, allergies, or special occasions. The restaurant will be notified of your requests.'
    },

    {
      id: 'free',
      question: 'Is booking with DineAhead free?',
      category: 'payments',
      answer: 'Yes! Booking is 100% free. We never charge you for making a reservation. Exclusive discounts and offers are applied automatically when you book through our platform.'
    },
    {
      id: 'deposit',
      question: 'Why do some restaurants require a deposit?',
      category: 'payments',
      answer: 'Some restaurants require a small deposit to secure your booking, especially for busy times or large groups. This deposit is deducted from your final bill when you dine at the restaurant.'
    },
    {
      id: 'discounts',
      question: 'How do I apply a discount or voucher?',
      category: 'payments',
      answer: 'Discounts and special offers are automatically applied when you book through our platform. You can also use your Yums points to get additional discounts on your bookings.'
    },

    {
      id: 'cancel',
      question: 'How do I cancel my reservation?',
      category: 'cancellations',
      answer: 'You can cancel for free up to a few hours before your reservation time. Log into your account, go to "My Reservations", select the booking, and click "Cancel Reservation".'
    },
    {
      id: 'cancel-policy',
      question: 'What is the cancellation policy?',
      category: 'cancellations',
      answer: 'Most restaurants allow free cancellation up to 2 hours before your reservation. Some restaurants may have different policies, which are clearly stated on their page. We recommend checking the restaurant\'s cancellation policy before booking.'
    },
    {
      id: 'modify',
      question: 'Can I modify my booking after confirmation?',
      category: 'cancellations',
      answer: 'Yes! You can modify your booking by logging into your account and selecting "Modify Booking" from your reservations list. You can change the date, time, or number of guests subject to availability.'
    },

    {
      id: 'account',
      question: 'How do I create an account?',
      category: 'account',
      answer: 'You can create an account by clicking "Sign Up" in the top right corner. You can sign up using your email address or through Google/Apple authentication for a faster experience.'
    },
    {
      id: 'reset-password',
      question: 'I forgot my password. How do I reset it?',
      category: 'account',
      answer: 'Click "Forgot Password" on the login page and enter your email address. We\'ll send you a link to reset your password. If you don\'t receive the email, check your spam folder or contact support.'
    },
    {
      id: 'delete-account',
      question: 'How do I delete my account?',
      category: 'account',
      answer: 'To delete your account, please contact our support team. We\'ll need to verify your identity and confirm your request before processing the deletion.'
    },

    {
      id: 'partner',
      question: 'I own a restaurant. How can I join DineAhead?',
      category: 'partners',
      answer: 'We would love to have you! Go to our "For Restaurants" page and click "Partner with us" to fill out an application form. Our team will contact you within 24 hours to get you set up.'
    },
    {
      id: 'restaurant-listing',
      question: 'How do I get my restaurant listed on DineAhead?',
      category: 'partners',
      answer: 'Click "For Restaurants" in the header and select "Partner with us". Fill out the form with your restaurant details. Our team will review your application and reach out to complete the onboarding process.'
    },
    {
      id: 'restaurant-photos',
      question: 'Can I update my restaurant photos and menu?',
      category: 'partners',
      answer: 'Yes! Once you\'re a partner, you\'ll have access to your restaurant dashboard where you can update photos, menus, special offers, and manage all your bookings.'
    },

    {
      id: 'contact',
      question: 'How do I contact support?',
      category: 'support',
      answer: 'You can reach our support team 24/7 by clicking "Contact Support" below or emailing us at support@dineahead.com. We\'ll respond within 2 hours.'
    },
    {
      id: 'app',
      question: 'Is there a DineAhead mobile app?',
      category: 'support',
      answer: 'Yes! The DineAhead app is available for both iOS and Android. Download it from the App Store or Google Play Store to book tables on the go and get exclusive mobile-only deals.'
    },
    {
      id: 'feedback',
      question: 'How do I leave feedback about a restaurant?',
      category: 'support',
      answer: 'After your dining experience, you\'ll receive an email inviting you to leave a review. You can also go to the restaurant\'s page and click "Write a Review" to share your experience with the community.'
    }
  ];

  get filteredFaqs(): Faq[] {
    if (!this.searchQuery || this.searchQuery.trim() === '') {
      return this.faqs;
    }
    const query = this.searchQuery.toLowerCase().trim();
    return this.faqs.filter(faq =>
      faq.question.toLowerCase().includes(query) ||
      faq.answer.toLowerCase().includes(query) ||
      (faq.category && faq.category.toLowerCase().includes(query))
    );
  }

  filterFaqs(): void {
    // This method is called on input change
    // The filteredFaqs getter handles the filtering logic
  }

  toggleFaq(id: string): void {
    if (this.openFaq === id) {
      this.openFaq = null;
    } else {
      this.openFaq = id;
    }
  }
}
