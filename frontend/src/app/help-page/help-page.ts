import { Component } from '@angular/core';
import {RouterLink} from '@angular/router';
import {Header} from '../header/header';
import {Footer} from '../footer/footer';

@Component({
  selector: 'app-help-page',
  imports: [RouterLink, Header, Footer],
  templateUrl: './help-page.html',
  styleUrl: './help-page.css',
})
export class HelpPage {
  openFaq: string | null = null;

  toggleFaq(id: string): void {
    if (this.openFaq === id) {
      this.openFaq = null;
    } else {
      this.openFaq = id;
    }
  }

  faqs = [
    {
      id: 'booking',
      question: 'How do I book a table?',
      answer: 'Simply search for your desired city or restaurant, choose your date, time, and party size, then click "Book a table". You will receive an instant confirmation via email and in your DineAhead account.'
    },
    {
      id: 'free',
      question: 'Is booking with DineAhead free?',
      answer: 'Yes! Booking is 100% free. We never charge you for making a reservation. Exclusive discounts and offers are applied automatically when you book through our platform.'
    },
    {
      id: 'cancel',
      question: 'How do I cancel my reservation?',
      answer: 'You can cancel for free up to a few hours before your reservation time. Log into your account, go to "My Reservations", select the booking, and click "Cancel Reservation".'
    },
    {
      id: 'yums',
      question: 'What are Yums and how do I earn them?',
      answer: 'Yums are our loyalty rewards! You earn Yums every time you complete a dining experience. You can then redeem your Yums for exclusive discounts, free appetizers, or special dining experiences at participating restaurants.'
    },
    {
      id: 'group',
      question: 'Can I book for a large group?',
      answer: 'Yes! For reservations larger than 8 people, please contact the restaurant directly via their phone number listed on their page, or use our group booking form to get a tailored offer.'
    },
    {
      id: 'partner',
      question: 'I own a restaurant. How can I join DineAhead?',
      answer: 'We would love to have you! Go to our "For Restaurants" page and click "Partner with us" to fill out an application form. Our team will contact you within 24 hours to get you set up.'
    }
  ];
}

