import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-restaurant-dashboard',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule],
  templateUrl: './restaurant-dashboard.html',
  styleUrl: './restaurant-dashboard.css'
})
export class RestaurantDashboard {
  isSidebarOpen = signal(true);
  activeTab = signal<'overview' | 'reservations' | 'tables' | 'schedule' | 'reviews' | 'profile'>('overview');

  constructor(private router: Router) {}

  toggleSidebar() { this.isSidebarOpen.update(val => !val); }
  setTab(tab: 'overview' | 'reservations' | 'tables' | 'schedule' | 'reviews' | 'profile') {
    this.activeTab.set(tab);
    if (window.innerWidth < 1024) this.isSidebarOpen.set(false);
  }
  logout() { this.router.navigate(['/']); }

  restaurant = {
    name: 'Le Comptoir Foch',
    first: 'Yllka',
    last: 'Bublaku',
    joined: '2022',
    avatar: 'Y'
  };

  stats = {
    todayBookings: 24,
    upcoming: 12,
    noShowRate: '4.2%',
    revenue: '€1,250'
  };

  reservations = [
    { id: 1, name: 'John Doe', time: '19:00', guests: 2, table: 'T1', status: 'Confirmed', type: 'Dinner' },
    { id: 2, name: 'Sarah Smith', time: '19:30', guests: 4, table: 'T2', status: 'Pending', type: 'Dinner' },
    { id: 3, name: 'Mike Johnson', time: '20:00', guests: 2, table: 'T3', status: 'Confirmed', type: 'Dinner' },
    { id: 4, name: 'Emma Wilson', time: '20:30', guests: 6, table: 'T4', status: 'Seated', type: 'Dinner' }
  ];

  tables = [
    { id: 1, name: 'T1', seats: 2, status: 'Available' },
    { id: 2, name: 'T2', seats: 4, status: 'Reserved' },
    { id: 3, name: 'T3', seats: 4, status: 'Occupied' },
    { id: 4, name: 'T4', seats: 6, status: 'Available' }
  ];

  schedule = [
    { day: 'Monday', open: '11:00', close: '22:00', status: 'Open' },
    { day: 'Tuesday', open: '11:00', close: '22:00', status: 'Open' },
    { day: 'Wednesday', open: '11:00', close: '22:00', status: 'Open' },
    { day: 'Thursday', open: '11:00', close: '22:00', status: 'Open' },
    { day: 'Friday', open: '11:00', close: '23:30', status: 'Open' },
    { day: 'Saturday', open: '11:00', close: '23:30', status: 'Open' },
    { day: 'Sunday', open: '12:00', close: '21:00', status: 'Closed' }
  ];

  scheduleOverrides = [
    { date: 'Dec 25, 2026', reason: 'Christmas Day', status: 'Closed', open: '', close: '' },
    { date: 'Dec 31, 2026', reason: 'New Year\'s Eve', status: 'Open', open: '18:00', close: '02:00' },
    { date: 'Jan 1, 2027', reason: 'New Year\'s Day', status: 'Closed', open: '', close: '' }
  ];

  reviews = [
    { id: 1, author: 'Jennifer E.', rating: '10', date: 'Aug 2, 2026', text: 'Lovely quiet area away from everything else. Excellent service and food was wonderful.', response: '' },
    { id: 2, author: 'Michael R.', rating: '9', date: 'Jul 15, 2026', text: 'Great food, but the waiter was a bit slow. Will go back though!', response: 'Thank you Michael! We appreciate your feedback and will work on service speed.' }
  ];

  profile = {
    restaurantName: 'Le Comptoir Foch',
    address: '176 Rue de la Pompe, 75016 Paris',
    siret: '123 456 789 00012',
    phone: '+33 1 45 00 00 00',
    email: 'contact@lecomptoirfoch.com',
    bankAccount: 'FR76 3000 4028 3798 7654 3210 943'
  };
}
