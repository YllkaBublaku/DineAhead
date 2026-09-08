import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Footer } from '../footer/footer';
import { ApiService } from '../services/api.service';
import { FavoritesService } from '../services/favorites.service';
import { TimeFormatPipe } from '../pipes/time-format.pipe';

export interface TimeSlot {
  slotTime?: string;
  slotDate?: string;
  maxCapacity?: number;
  isActive?: boolean;
}

export interface RestaurantItem {
  id: number;
  name: string;
  slug: string;
  address: string;
  city: string;
  cuisineType: string;
  priceRange: string;
  coverPhotoUrl: string;
  averageRating: number;
  reviewCount: number;
  image?: string;
  gallery?: string[];
  description?: string;
  specialOffer?: string;
  coords?: { x: number; y: number; lat: number; lng: number };
  latitude?: number;
  longitude?: number;
  state?: string;
  zip?: string;
  phone?: string;
  timeSlots?: TimeSlot[];
  reservations?: any[];
  features?: string[];
}

@Component({
  selector: 'app-similar-restaurants',
  standalone: true,
  imports: [RouterLink, CommonModule, FormsModule, Footer, TimeFormatPipe],
  templateUrl: './similar-restaurants.html',
  styleUrl: './similar-restaurants.css'
})
export class SimilarRestaurants implements OnInit, AfterViewInit {
  selectedDate = this.formatDate(new Date());
  selectedTime = '19:00';
  selectedGuests = 2;

  selectedBookingDate: Date | null = null;
  selectedBookingTime: string | null = null;
  selectedBookingGuests: number = 2;

  dateModalOpen = false;
  timeModalOpen = false;
  guestsModalOpen = false;

  currentMonth = new Date().getMonth();
  currentYear = new Date().getFullYear();
  selectedDay = new Date().getDate();

  allRestaurants: RestaurantItem[] = [];
  filteredRestaurants: RestaurantItem[] = [];
  restaurants: RestaurantItem[] = [];
  loading = false;
  errorMessage = '';
  totalElements = 0;

  referenceRestaurant: RestaurantItem | null = null;
  referenceRestaurantName = 'La Reine du Kashmir';
  referenceCuisine = 'Indian';
  referenceCity = 'Paris';

  timeSlots: string[] = [];
  private searchTimeout: any;

  sortBy = 'averageRating';
  infoMessage: string = '';

  paymentModalOpen = false;
  bookingModalOpen = false;
  bookingSuccess = false;
  bookingLoading = false;
  bookingMessage: string = '';
  bookingError = '';
  isPaymentRequired = false;
  bookingDepositAmount = 0;
  selectedRestaurantForBooking: RestaurantItem | null = null;
  selectedTimeslotForBooking: TimeSlot | null = null;

  bookingForm = {
    specialRequests: '',
    paymentMethod: 'card'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private api: ApiService,
    private cdr: ChangeDetectorRef,
    private favoritesService: FavoritesService
  ) {}

  ngOnInit(): void {
    this.generateTimeSlots();

    const today = new Date();
    this.selectedDate = this.formatDate(today);
    this.selectedDay = today.getDate();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();

    this.route.queryParams.subscribe(params => {
      const restaurantId = params['restaurantId'];
      if (restaurantId) {
        this.loadReferenceRestaurant(restaurantId);
      } else {
        this.referenceRestaurantName = 'Restaurants';
        this.infoMessage = 'Here are some great options. Just enter your preferred date, time, and number of people so we can give you the best match.';
        this.loadAllRestaurants();
      }
    });
  }

  ngAfterViewInit(): void {
  }

  async loadReferenceRestaurant(id: number): Promise<void> {
    this.loading = true;
    try {
      const restaurant = await this.api.getRestaurantById(id);
      if (restaurant) {
        this.referenceRestaurant = restaurant;
        this.referenceRestaurantName = restaurant.name;
        this.referenceCuisine = restaurant.cuisineType || '';
        this.referenceCity = restaurant.city || 'Paris';

        this.infoMessage = `Here are some great options similar to <strong>${restaurant.name}</strong>. Just enter your preferred date, time, and number of people so we can give you the best match.`;

        document.title = `Similar to ${restaurant.name} - DineAhead`;
        this.cdr.detectChanges();
      }
      await this.loadAllRestaurants();
    } catch (error) {
      console.error('Failed to load reference restaurant:', error);
      this.referenceRestaurantName = 'the selected restaurant';
      this.infoMessage = 'Here are some great options. Just enter your preferred date, time, and number of people so we can give you the best match.';
      await this.loadAllRestaurants();
    } finally {
      this.loading = false;
    }
  }
  async loadAllRestaurants(): Promise<void> {
    this.loading = true;
    try {
      const data = await this.api.getRestaurants();
      this.allRestaurants = Array.isArray(data) ? data : [];

      if (this.referenceRestaurant) {
        this.allRestaurants = this.allRestaurants.filter(r => r.id !== this.referenceRestaurant?.id);
      }

      this.applyFilters();
    } catch (error) {
      console.error('Failed to load restaurants:', error);
      this.allRestaurants = [];
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  applyFilters(): void {
    let filtered = [...this.allRestaurants];

    if (this.referenceCuisine) {
      filtered = filtered.filter(rest =>
        rest.cuisineType?.toLowerCase() === this.referenceCuisine.toLowerCase() ||
        rest.cuisineType?.toLowerCase().includes(this.referenceCuisine.toLowerCase().split(' ')[0])
      );
    }

    if (this.referenceCity) {
      filtered = filtered.filter(rest =>
        rest.city?.toLowerCase() === this.referenceCity.toLowerCase()
      );
    }

    if (this.selectedBookingDate && this.selectedBookingTime) {
      const year = this.selectedBookingDate.getFullYear();
      const month = String(this.selectedBookingDate.getMonth() + 1).padStart(2, '0');
      const day = String(this.selectedBookingDate.getDate()).padStart(2, '0');
      const selectedDateStr = `${year}-${month}-${day}`;

      filtered = filtered.filter(rest => {
        if (rest.timeSlots && rest.timeSlots.length > 0) {
          const hasMatch = rest.timeSlots.some(slot => {
            if (slot.isActive === false) return false;
            const slotTime = slot.slotTime as string;
            if (!slotTime) return false;

            const timeStr = slotTime.substring(0, 5);
            const selectedTimeStr = this.selectedBookingTime;

            const timeMatch = timeStr === selectedTimeStr;
            const guestsMatch = !slot.maxCapacity || (this.selectedBookingGuests || 2) <= slot.maxCapacity;
            const dateMatch = slot.slotDate === selectedDateStr;

            return timeMatch && guestsMatch && dateMatch;
          });
          return hasMatch;
        }
        return true;
      });
    }

    this.applySorting(filtered);

    this.filteredRestaurants = filtered;
    this.totalElements = filtered.length;
    this.restaurants = filtered.slice(0, 20); // Show up to 20 similar restaurants

    this.cdr.detectChanges();
  }

  applySorting(restaurants: RestaurantItem[]): void {
    switch (this.sortBy) {
      case 'averageRating':
        restaurants.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        break;
      case 'name':
        restaurants.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'reviewCount':
        restaurants.sort((a, b) => (b.reviewCount || 0) - (a.reviewCount || 0));
        break;
      default:
        break;
    }
  }

  formatDate(date: Date): string {
    const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  generateTimeSlots(): void {
    this.timeSlots = [];
    for (let hour = 0; hour < 24; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const h = hour.toString().padStart(2, '0');
        const m = minute.toString().padStart(2, '0');
        this.timeSlots.push(`${h}:${m}`);
      }
    }
  }

  getDaysInMonth(month: number, year: number): number[] {
    const days = [];
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  }

  getFirstDayOfMonth(month: number, year: number): number {
    return new Date(year, month, 1).getDay();
  }

  getMonthName(month: number): string {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'];
    return months[month];
  }

  prevMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
  }

  selectDate(day: number): void {
    this.selectedDay = day;
    const date = new Date(this.currentYear, this.currentMonth, day);
    this.selectedDate = this.formatDate(date);
    this.dateModalOpen = false;
    this.selectedBookingDate = date;
    this.applyFilters();
  }

  isDateInPast(day: number, month: number, year: number): boolean {
    const selectedDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);
    return selectedDate < today;
  }

  isTimeInPast(time: string): boolean {
    const today = new Date();
    const selectedDate = new Date(this.currentYear, this.currentMonth, this.selectedDay);

    if (selectedDate > today) {
      return false;
    }

    if (selectedDate.toDateString() === today.toDateString()) {
      const [hours, minutes] = time.split(':').map(Number);
      const selectedTime = new Date();
      selectedTime.setHours(hours, minutes, 0, 0);
      return selectedTime < today;
    }
    return true;
  }

  selectTime(time: string): void {
    this.selectedTime = time;
    this.timeModalOpen = false;
    this.selectedBookingTime = time;
    this.applyFilters();
  }

  selectGuests(count: number): void {
    this.selectedGuests = count;
    this.guestsModalOpen = false;
    this.selectedBookingGuests = count;
    this.applyFilters();
  }

  resetBookingFilters(): void {
    this.selectedBookingDate = null;
    this.selectedBookingTime = null;
    this.selectedBookingGuests = 2;

    const today = new Date();
    this.selectedDate = this.formatDate(today);
    this.selectedTime = '19:00';
    this.selectedGuests = 2;
    this.selectedDay = today.getDate();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();

    this.applyFilters();
  }

  getAvailableTimeSlots(restaurant: RestaurantItem): TimeSlot[] {
    if (!restaurant.timeSlots || restaurant.timeSlots.length === 0) {
      return [];
    }

    let targetDate = this.selectedBookingDate;
    if (!targetDate) {
      targetDate = new Date();

      const todayStr = this.formatDateToYYYYMMDD(targetDate);
      const hasTodaySlots = restaurant.timeSlots.some(slot =>
        slot.slotDate === todayStr && slot.isActive !== false
      );

      if (!hasTodaySlots) {
        const availableDates = restaurant.timeSlots
          .filter(slot => slot.isActive !== false && slot.slotDate)
          .map(slot => slot.slotDate)
          .filter((date): date is string => date !== undefined && date !== null && date !== '')
          .sort();

        if (availableDates.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          for (const dateStr of availableDates) {
            const [year, month, day] = dateStr.split('-').map(Number);
            const slotDate = new Date(year, month - 1, day);
            slotDate.setHours(0, 0, 0, 0);

            if (slotDate >= today) {
              targetDate = slotDate;
              break;
            }
          }
        }
      }
    }

    if (!targetDate) {
      return [];
    }

    const guests = this.selectedBookingGuests || 2;
    const year = targetDate.getFullYear();
    const month = String(targetDate.getMonth() + 1).padStart(2, '0');
    const day = String(targetDate.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    const slotsForDate = restaurant.timeSlots.filter(slot => {
      if (slot.isActive === false) return false;
      if (slot.slotDate !== dateStr) return false;
      if (slot.maxCapacity && guests > slot.maxCapacity) return false;
      return true;
    });

    const seenTimes = new Set<string>();
    const uniqueSlots = slotsForDate.filter(slot => {
      const time = (slot.slotTime as string).substring(0, 5);
      if (seenTimes.has(time)) return false;
      seenTimes.add(time);
      return true;
    });

    return uniqueSlots.sort((a, b) => {
      const timeA = (a.slotTime as string).substring(0, 5);
      const timeB = (b.slotTime as string).substring(0, 5);
      return timeA.localeCompare(timeB);
    });
  }

  private formatDateToYYYYMMDD(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getPriceValue(priceRange: string): number {
    const map: { [key: string]: number } = {
      '€': 25,
      '€€': 50,
      '€€€': 100,
      '€€€€': 150
    };
    return map[priceRange] || 50;
  }

  isRestaurantExpensive(restaurant: RestaurantItem): boolean {
    const priceValue = this.getPriceValue(restaurant.priceRange);
    return priceValue >= 100;
  }

  scrollFilters(offset: number): void {
    const el = document.getElementById('filters-carousel');
    if (el) el.scrollBy({ left: offset, behavior: 'smooth' });
  }

  toggleDarkMode(): void {
    document.documentElement.classList.toggle('dark');
  }

  isFavorite(id: number): boolean {
    return this.favoritesService.isFavorite(id);
  }

  toggleFavorite(id: number, event?: Event): void {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const restaurant = this.allRestaurants.find(r => r.id === id);
    if (restaurant) {
      this.favoritesService.toggleFavorite({
        id: restaurant.id,
        name: restaurant.name,
        coverPhotoUrl: restaurant.coverPhotoUrl || '',
        cuisineType: restaurant.cuisineType || '',
        priceRange: restaurant.priceRange || '',
        averageRating: restaurant.averageRating || 0,
        reviewCount: restaurant.reviewCount || 0,
        address: restaurant.address || '',
        city: restaurant.city || ''
      });
    }
  }

  getPageTitle(): string {
    if (this.referenceRestaurant) {
      return `Similar to ${this.referenceRestaurant.name}`;
    }
    return 'Similar Restaurants';
  }

  getPageDescription(): string {
    if (this.referenceRestaurant) {
      return `Discover restaurants similar to ${this.referenceRestaurant.name} in ${this.referenceCity}. Find the perfect dining experience with easy instant online booking.`;
    }
    return 'Discover similar restaurants with easy instant online booking.';
  }

  getBookingQueryParams(): any {
    const params: any = {};
    if (this.selectedBookingDate) {
      const dateStr = this.selectedBookingDate.toISOString().split('T')[0];
      params.date = dateStr;
    }
    if (this.selectedBookingTime) {
      params.time = this.selectedBookingTime;
    }
    if (this.selectedBookingGuests) {
      params.guests = this.selectedBookingGuests;
    }
    return params;
  }

  getEmptyDays(): number[] {
    const firstDay = this.getFirstDayOfMonth(this.currentMonth, this.currentYear);
    const emptyCount = firstDay === 0 ? 6 : firstDay - 1;
    return Array(emptyCount).fill(0);
  }

  async openBookingModal(rest: RestaurantItem, slot: TimeSlot, event?: Event): Promise<void> {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    this.selectedRestaurantForBooking = rest;
    this.selectedTimeslotForBooking = slot;

    if (slot.slotDate) {
      const dateParts = slot.slotDate.split('-');
      if (dateParts.length === 3) {
        this.selectedBookingDate = new Date(
          parseInt(dateParts[0]),
          parseInt(dateParts[1]) - 1,
          parseInt(dateParts[2])
        );
      }
    }

    if (slot.slotTime) {
      this.selectedBookingTime = (slot.slotTime as string).substring(0, 5);
    }

    this.bookingModalOpen = true;
    this.bookingSuccess = false;
    this.bookingError = '';
    this.bookingLoading = false;
    this.bookingForm = {
      specialRequests: '',
      paymentMethod: 'card'
    };
    this.isPaymentRequired = false;
    this.bookingDepositAmount = 0;
    this.paymentModalOpen = false;

    try {
      const depositInfo = await this.api.getRestaurantDeposit(rest.id);
      if (depositInfo && depositInfo.requiresDeposit) {
        this.isPaymentRequired = true;
        this.bookingDepositAmount = depositInfo.amount || 0;
      }
    } catch (error) {
      console.error('Error fetching deposit info:', error);
      this.isPaymentRequired = false;
      this.bookingDepositAmount = 0;
    }

    this.cdr.detectChanges();
  }

  closeBookingModal(): void {
    this.bookingModalOpen = false;
    this.paymentModalOpen = false;
    this.bookingSuccess = false;
    this.selectedRestaurantForBooking = null;
    this.selectedTimeslotForBooking = null;
    this.bookingError = '';
    this.bookingMessage = '';
    this.bookingLoading = false;
    this.bookingForm = {
      specialRequests: '',
      paymentMethod: 'card'
    };
    this.isPaymentRequired = false;
    this.bookingDepositAmount = 0;
    this.cdr.detectChanges();
  }

  async confirmBooking(): Promise<void> {
    if (!this.selectedRestaurantForBooking || !this.selectedTimeslotForBooking) {
      this.bookingError = 'No restaurant or time slot selected.';
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';

    try {
      const depositInfo = await this.api.getRestaurantDeposit(this.selectedRestaurantForBooking.id);

      if (depositInfo && depositInfo.requiresDeposit && depositInfo.amount > 0) {
        this.isPaymentRequired = true;
        this.bookingDepositAmount = depositInfo.amount;

        if (this.bookingForm.paymentMethod === 'card') {
          this.paymentModalOpen = true;
          this.bookingLoading = false;
          this.cdr.detectChanges();
          return;
        }

        await this.createBookingWithDeposit();

        this.bookingMessage = 'Your reservation has been confirmed. Check your email for details.';
        this.bookingSuccess = true;
        this.bookingLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.closeBookingModal();
        }, 2500);
        return;
      }

      await this.createBooking();

      this.bookingMessage = 'Your reservation has been confirmed. Check your email for details.';
      this.bookingSuccess = true;
      this.bookingLoading = false;
      this.cdr.detectChanges();

      setTimeout(() => {
        this.closeBookingModal();
      }, 2500);

    } catch (error) {
      console.error('Booking failed:', error);
      this.bookingError = error instanceof Error ? error.message : 'Failed to book reservation. Please try again.';
      this.bookingLoading = false;
      this.cdr.detectChanges();
    }
  }

  async createBooking(): Promise<void> {
    if (!this.selectedRestaurantForBooking || !this.selectedTimeslotForBooking) {
      throw new Error('No restaurant or time slot selected');
    }

    const year = this.selectedBookingDate?.getFullYear() || new Date().getFullYear();
    const month = String((this.selectedBookingDate?.getMonth() || new Date().getMonth()) + 1).padStart(2, '0');
    const day = String(this.selectedBookingDate?.getDate() || new Date().getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    await this.api.createReservation({
      restaurantId: this.selectedRestaurantForBooking.id,
      date: this.selectedTimeslotForBooking.slotDate || dateStr,
      time: this.selectedTimeslotForBooking.slotTime,
      guests: this.selectedBookingGuests || 2,
      specialRequests: this.bookingForm.specialRequests || '',
      status: 'CONFIRMED',
      paymentMethod: this.bookingForm.paymentMethod.toUpperCase(),
      depositPaid: false,
      depositAmount: 0
    });
  }

  async createBookingWithDeposit(): Promise<void> {
    if (!this.selectedRestaurantForBooking || !this.selectedTimeslotForBooking) {
      throw new Error('No restaurant or time slot selected');
    }

    const year = this.selectedBookingDate?.getFullYear() || new Date().getFullYear();
    const month = String((this.selectedBookingDate?.getMonth() || new Date().getMonth()) + 1).padStart(2, '0');
    const day = String(this.selectedBookingDate?.getDate() || new Date().getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    await this.api.createReservation({
      restaurantId: this.selectedRestaurantForBooking.id,
      date: this.selectedTimeslotForBooking.slotDate || dateStr,
      time: this.selectedTimeslotForBooking.slotTime,
      guests: this.selectedBookingGuests || 2,
      specialRequests: this.bookingForm.specialRequests || '',
      status: 'PENDING',
      paymentMethod: this.bookingForm.paymentMethod.toUpperCase(),
      depositPaid: false,
      depositAmount: this.bookingDepositAmount
    });
  }

  async processPayment(): Promise<void> {
    if (!this.selectedRestaurantForBooking || !this.selectedTimeslotForBooking) {
      this.bookingError = 'No restaurant or time slot selected.';
      this.bookingLoading = false;
      return;
    }

    this.bookingLoading = true;
    this.bookingError = '';
    this.bookingMessage = '';

    try {
      const year = this.selectedBookingDate?.getFullYear() || new Date().getFullYear();
      const month = String((this.selectedBookingDate?.getMonth() || new Date().getMonth()) + 1).padStart(2, '0');
      const day = String(this.selectedBookingDate?.getDate() || new Date().getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // Create reservation first
      const reservation = await this.api.createReservation({
        restaurantId: this.selectedRestaurantForBooking.id,
        date: this.selectedTimeslotForBooking.slotDate || dateStr,
        time: this.selectedTimeslotForBooking.slotTime,
        guests: this.selectedBookingGuests || 2,
        specialRequests: this.bookingForm.specialRequests || '',
        status: 'PENDING',
        paymentMethod: this.bookingForm.paymentMethod.toUpperCase()
      });

      console.log('Reservation created:', reservation);

      if (!reservation || !reservation.id) {
        throw new Error('Reservation was created but no ID was returned');
      }

      const userJson = localStorage.getItem('user');
      const user = userJson ? JSON.parse(userJson) : null;
      const userId = user?.id || null;

      const paymentIntentData = await this.api.createPaymentIntent(
        reservation.id,
        userId
      );

      console.log('Payment intent created:', paymentIntentData);

      const result = await this.api.confirmPayment(paymentIntentData.paymentIntentId);
      console.log('Payment confirmation result:', result);

      if (result.success || result.status === 'SUCCEEDED') {
        await this.api.updateReservation(reservation.id, {
          depositPaid: true,
          depositAmount: this.bookingDepositAmount,
          status: 'CONFIRMED'
        });

        this.bookingMessage = 'Your reservation has been confirmed. Check your email for details.';
        this.bookingSuccess = true;
        this.paymentModalOpen = false;
        this.bookingLoading = false;
        this.cdr.detectChanges();

        setTimeout(() => {
          this.closeBookingModal();
        }, 2500);
      } else {
        throw new Error('Payment confirmation failed');
      }

    } catch (error) {
      console.error('Payment failed:', error);
      this.bookingError = error instanceof Error ? error.message : 'Payment processing failed. Please try again.';
      this.bookingLoading = false;
      this.cdr.detectChanges();
    }
  }
}

