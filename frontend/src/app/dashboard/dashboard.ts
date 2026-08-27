import { Component, signal } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class Dashboard {
  isSidebarOpen = signal(true);
  activeTab = signal<'bookings' | 'favorites' | 'reviews' | 'personal'>('bookings');

  constructor(private router: Router) {}

  toggleSidebar() {
    this.isSidebarOpen.update(val => !val);
  }

  setTab(tab: 'bookings' | 'favorites' | 'reviews' | 'personal') {
    this.activeTab.set(tab);
    if (window.innerWidth < 1024) {
      this.isSidebarOpen.set(false);
    }
  }

  goToHelp() {
    this.router.navigate(['/help']);
  }

  logout() {
    this.router.navigate(['/']);
  }

  toggleFavorite(id: number) {
    this.favorites = this.favorites.filter(fav => fav.id !== id);
  }

  bookings = [
    { id: 1, name: "L'Arpège by Alain Passard", image: 'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=400&h=300&q=80', date: 'Fri, Aug 22, 2026', time: '8:00 PM', guests: 2, status: 'Confirmed', offer: '-20%' },
    { id: 2, name: 'Trattoria Dalloste Bistecca', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&h=300&q=80', date: 'Sat, Aug 30, 2026', time: '7:30 PM', guests: 4, status: 'Pending', offer: 'Yums x2' },
    { id: 3, name: 'Terry\'s Café', image: 'https://images.unsplash.com/photo-1525610553991-2bede1a236e2?auto=format&fit=crop&w=400&h=300&q=80', date: 'Sep 5, 2026', time: '12:30 PM', guests: 2, status: 'Confirmed' }
  ];

  favorites = [
    { id: 1, name: 'La Reine du Kashmir', image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&w=400&h=300&q=80', cuisine: 'Indian • ~€25', rating: '9.5', description: 'Aromatic saffron biryanis, rich Kashmiri rogan josh, and homemade naan.', offer: 'Up to -50%' },
    { id: 2, name: 'Hostaria Ago e Lillo', image: 'https://images.unsplash.com/photo-1546549032-9571cd6b27df?auto=format&fit=crop&w=400&h=300&q=80', cuisine: 'Italian • ~€18', rating: '9.2', description: 'Authentic Roman carbonara with crispy guanciale and pecorino wheels.', offer: 'Up to -40%' },
    { id: 3, name: 'Artisan de la Truffe', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=400&h=300&q=80', cuisine: 'French • ~€39', rating: '9.4', description: 'An ode to truffles across artisanal pasta, aged ribeye, and burrata.', offer: 'Up to -30%' },
    { id: 4, name: 'Batistou', image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=400&h=300&q=80', cuisine: 'French • ~€22', rating: '9.1', description: 'Cozy bistro serving duck confit and fresh cocktails on a heated patio.', offer: 'Up to -50%' }
  ];

  reviews = [
    { id: 1, restaurant: 'Restaurant Kei', image: 'https://images.unsplash.com/photo-1578474846511-04ba529f0b88?auto=format&fit=crop&w=400&h=300&q=80', rating: '10', date: 'Aug 2, 2026', text: 'Incredible French-Japanese tasting menu. Service was flawless!' },
    { id: 2, restaurant: 'Au Bourguignon du Marais', image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=400&h=300&q=80', rating: '9', date: 'Jul 15, 2026', text: 'Classic bistro vibes, amazing wine list. Highly recommend the beef bourguignon.' }
  ];

  user = {
    firstName: 'Yllka',
    lastName: 'Bublaku',
    email: 'yllkabublaku@gmail.com',
    phone: '+44 7911 123456',
    joined: '2026'
  };
}
