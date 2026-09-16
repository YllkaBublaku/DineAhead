import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  private getHeaders() {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }

  private getToken(): string | null {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        const userData = JSON.parse(user);
        return userData.token || userData.accessToken || null;
      } catch (e) {
        return null;
      }
    }
    return null;
  }

  registerUser(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register`, userData, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  registerRestaurant(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/register/restaurant`, userData, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  loginUser(loginData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/login`, loginData, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  requestPasswordReset(emailData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/forgot-password`, emailData, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  resetPassword(resetData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/users/reset-password`, resetData, {
      headers: this.getHeaders(),
      withCredentials: true
    });
  }

  logout(): Observable<any> {
    return this.http.post('http://localhost:8080/logout', {}, {
      withCredentials: true,
      responseType: 'text' as 'json'
    });
  }

  public getCurrentUser(): any | null {
    const userJson = localStorage.getItem('user');
    if (!userJson) return null;

    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error('Error parsing user data:', e);
      return null;
    }
  }

  public getCurrentUserId(): number | null {
    const user = this.getCurrentUser();
    return user?.id || user?.userId || null;
  }

  getRestaurants(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/restaurants`)
        .pipe(
          map(response => {
            if (Array.isArray(response)) {
              return response;
            }
            if (response && (response as any).content && Array.isArray((response as any).content)) {
              return (response as any).content;
            }
            if (response && (response as any).data && Array.isArray((response as any).data)) {
              return (response as any).data;
            }
            console.warn('Unexpected response format:', response);
            return [];
          })
        )
    );
  }

  getRestaurantsByCity(city: string): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/restaurants/city/${city}`)
        .pipe(
          map(response => {
            if (Array.isArray(response)) {
              return response;
            }
            if (response && (response as any).content && Array.isArray((response as any).content)) {
              return (response as any).content;
            }
            return [];
          })
        )
    );
  }

  getRestaurantById(id: number): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/restaurants/${id}`)
    );
  }

  getRestaurantsByOwner(ownerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurants/owner/${ownerId}`).pipe(
      map(response => Array.isArray(response) ? response : [])
    );
  }

  getReviewsByRestaurant(restaurantId: number): Promise<any[]> {
    console.log('Fetching reviews for restaurant:', restaurantId);
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/restaurants/${restaurantId}/reviews`)
        .pipe(
          map(response => {
            console.log('Reviews raw response:', response);
            if (Array.isArray(response)) {
              return response;
            }
            if (response && response.content && Array.isArray(response.content)) {
              return response.content;
            }
            if (response && response._embedded) {
              for (const key in response._embedded) {
                if (Array.isArray(response._embedded[key])) {
                  return response._embedded[key];
                }
              }
            }
            if (response && typeof response === 'object') {
              return [response];
            }
            return [];
          })
        )
    );
  }

  getFeatures(): Promise<string[]> {
    return firstValueFrom(
      this.http.get<string[]>(`${this.apiUrl}/restaurants/features`)
        .pipe(
          map(response => {
            if (Array.isArray(response)) {
              return response;
            }
            if (response && (response as any).content && Array.isArray((response as any).content)) {
              return (response as any).content;
            }
            return [];
          })
        )
    );
  }

  async getRestaurantDeposit(restaurantId: number): Promise<any> {
    try {
      const token = this.getToken();
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiUrl}/deposit-settings/restaurant/${restaurantId}`, {
        headers: headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          console.log('No deposit settings found, returning default');
          return {
            requiresDeposit: false,
            amount: 0
          };
        }
        throw new Error(`Failed to fetch deposit settings: ${response.status}`);
      }

      const data = await response.json();
      console.log('Deposit settings response:', data);

      if (!data) {
        return {
          requiresDeposit: false,
          amount: 0
        };
      }

      return {
        requiresDeposit: data.requiresDeposit || false,
        amount: data.depositAmount || data.amount || 0
      };
    } catch (error) {
      console.error('Error fetching deposit info:', error);
      return {
        requiresDeposit: false,
        amount: 0
      };
    }
  }

  async processPayment(paymentData: any): Promise<any> {
    try {
      const token = this.getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiUrl}/payments/process-deposit`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(paymentData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Payment error response:', errorText);
        throw new Error(`Payment processing failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Payment processed:', result);
      return result;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }

  async createReservation(reservationData: any): Promise<any> {
    try {
      const currentUser = this.getCurrentUser();
      const userId = currentUser?.id || currentUser?.userId || null;

      const formattedData: any = {
        restaurant: { id: reservationData.restaurantId },
        reservationDate: reservationData.date,
        reservationTime: reservationData.time,
        partySize: reservationData.guests,
        specialRequests: reservationData.specialRequests || '',
        status: 'PENDING',
        paymentMethod: (reservationData.paymentMethod || 'CARD').toUpperCase()
      };

      if (userId) {
        formattedData.user = { id: userId };
      }

      console.log('Creating reservation for user:', userId || 'Anonymous');
      console.log('Reservation data:', formattedData);

      const token = this.getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiUrl}/reservations`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(formattedData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Reservation API error:', errorText);
        throw new Error(`Reservation creation failed: ${response.status}`);
      }

      const result = await response.json();
      console.log('Reservation created - FULL RESPONSE:', JSON.stringify(result, null, 2));
      console.log('Result keys:', Object.keys(result));
      console.log('Result id:', result.id);
      console.log('Result id from _embedded?', result._embedded);
      return result;
    } catch (error) {
      console.error('Reservation error:', error);
      throw error;
    }
  }

  async createPaymentIntent(reservationId: number, userId: number | null): Promise<any> {
    try {
      const token = this.getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Creating payment intent for reservation: ${reservationId}, user: ${userId}`);

      const response = await fetch(`${this.apiUrl}/payments/create-payment-intent`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          reservationId: reservationId,
          userId: userId
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Create payment intent error:', errorText);
        throw new Error(`Failed to create payment intent: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Create payment intent error:', error);
      throw error;
    }
  }

  async confirmPayment(paymentIntentId: string): Promise<any> {
    try {
      const token = this.getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.apiUrl}/payments/confirm-payment`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({ paymentIntentId: paymentIntentId })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Confirm payment error:', errorText);
        throw new Error(`Failed to confirm payment: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Confirm payment error:', error);
      throw error;
    }
  }

  async updateReservation(reservationId: number, data: any): Promise<any> {
    try {
      const token = this.getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      console.log(`Updating reservation ${reservationId} with data:`, data);

      const response = await fetch(`${this.apiUrl}/reservations/${reservationId}`, {
        method: 'PATCH',
        headers: headers,
        body: JSON.stringify(data)
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update reservation error response:', errorText);
        throw new Error(`Failed to update reservation: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Update reservation success, result:', result);
      return result;
    } catch (error) {
      console.error('Update reservation error:', error);
      throw error;
    }
  }

  async markReviewHelpful(reviewId: number): Promise<any> {
    try {
      const currentUser = this.getCurrentUser();
      const userId = currentUser?.id || currentUser?.userId || null;

      const token = this.getToken();
      const headers: any = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = userId
        ? `${this.apiUrl}/reviews/${reviewId}/helpful?userId=${userId}`
        : `${this.apiUrl}/reviews/${reviewId}/helpful`;

      const response = await fetch(url, {
        method: 'POST',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Helpful API error:', errorText);
        throw new Error(`Failed to mark review as helpful: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      throw error;
    }
  }

  async getReviewHelpfulStatus(reviewId: number): Promise<any> {
    try {
      const currentUser = this.getCurrentUser();
      const userId = currentUser?.id || currentUser?.userId || null;

      const token = this.getToken();
      const headers: any = {};
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const url = userId
        ? `${this.apiUrl}/reviews/${reviewId}/helpful-status?userId=${userId}`
        : `${this.apiUrl}/reviews/${reviewId}/helpful-status`;

      const response = await fetch(url, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { helpful: false };
        }
        throw new Error(`Failed to get helpful status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting helpful status:', error);
      return { helpful: false };
    }
  }

  getHomeData(): Promise<any> {
    return firstValueFrom(
      this.http.get<any>(`${this.apiUrl}/home/data`)
        .pipe(
          map(response => {
            if (response && response.restaurants) {
              return response;
            }
            return { restaurants: [], cityCounts: {}, cuisineCounts: {} };
          })
        )
    );
  }

  getCities(): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/cities`)
        .pipe(
          map(response => {
            if (Array.isArray(response)) {
              return response;
            }
            return [];
          })
        )
    );
  }

  async submitContact(contactData: any): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/contacts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to submit contact: ${response.status}`);
      }

      const data = await response.json();
      return data;

    } catch (error) {
      throw error;
    }
  }

  getRestaurantStats(restaurantId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/reservations/restaurant/${restaurantId}/stats`);
  }

  getReservationsByRestaurantAndDate(restaurantId: number, date: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}/reservations/restaurant/${restaurantId}/date/${date}`
    );
  }

  getReservationsByRestaurant(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reservations/restaurant/${restaurantId}`);
  }

  changeReservationStatus(id: number, status: string, userId: number | null): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/reservations/${id}/status`, {
      status,
      userId
    });
  }

  getTablesByRestaurant(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurant-tables/restaurant/${restaurantId}`);
  }

  createTable(restaurantId: number, table: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/restaurant-tables/restaurant/${restaurantId}`, table);
  }

  updateTable(id: number, table: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/restaurant-tables/${id}`, table);
  }

  deleteTable(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/restaurant-tables/${id}`);
  }

  getHoursByRestaurant(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurant-hours/restaurant/${restaurantId}`);
  }

  createHours(restaurantId: number, hours: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/restaurant-hours/restaurant/${restaurantId}`, hours);
  }

  updateHours(id: number, hours: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/restaurant-hours/${id}`, hours);
  }

  deleteHours(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/restaurant-hours/${id}`);
  }

  getOverridesByRestaurant(restaurantId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/restaurant-overrides/restaurant/${restaurantId}`);
  }

  createOverride(restaurantId: number, override: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/restaurant-overrides/restaurant/${restaurantId}`, override);
  }

  updateOverride(id: number, override: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/restaurant-overrides/${id}`, override);
  }

  deleteOverride(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/restaurant-overrides/${id}`);
  }

  respondToReview(reviewId: number, response: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/reviews/${reviewId}/response`, { response });
  }

  updateRestaurant(id: number, updates: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/restaurants/${id}`, updates);
  }

  getAvailability(restaurantId: number, date: string, guests: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/restaurants/${restaurantId}/availability?date=${date}&guests=${guests}`
    );
  }

  getBatchAvailability(restaurantIds: number[], date: string, guests: number): Observable<Record<number, any>> {
    return this.http.post<Record<number, any>>(
      `${this.apiUrl}/restaurants/availability/batch`,
      { restaurantIds, date, guests }
    );
  }

  getReservationsByUser(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/reservations/user/${userId}`);
  }

  cancelReservation(id: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/reservations/${id}/cancel`, {});
  }

  getReviewsByUser(userId: number): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/reviews/user/${userId}`)
        .pipe(
          map(response => {
            if (Array.isArray(response)) return response;
            if (response && (response as any).content && Array.isArray((response as any).content)) {
              return (response as any).content;
            }
            return [];
          })
        )
    );
  }

  createReview(reviewData: {
    restaurantId: number;
    userId: number;
    rating: number;
    foodRating?: number | null;
    serviceRating?: number | null;
    ambianceRating?: number | null;
    comment: string;
  }): Promise<any> {
    const payload: any = {
      restaurant: { id: reviewData.restaurantId },
      user: { id: reviewData.userId },
      rating: reviewData.rating,
      comment: reviewData.comment
    };

    if (reviewData.foodRating != null)     payload.foodRating     = reviewData.foodRating;
    if (reviewData.serviceRating != null)  payload.serviceRating  = reviewData.serviceRating;
    if (reviewData.ambianceRating != null) payload.ambianceRating = reviewData.ambianceRating;

    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/reviews`, payload, {
        headers: this.getHeaders(),
        withCredentials: true
      })
    );
  }

  updateUser(id: number, updates: any): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/users/${id}`, updates);
  }

  getUserById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/${id}`);
  }

  getUserFavorites(userId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/favorites/user/${userId}`);
  }

  addFavorite(userId: number, restaurantId: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/favorites/${userId}/${restaurantId}`, {});
  }

  removeFavorite(userId: number, restaurantId: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/favorites/${userId}/${restaurantId}`);
  }

  uploadUserAvatar(userId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/users/${userId}/avatar`, formData);
  }

  uploadRestaurantCover(restaurantId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.apiUrl}/restaurants/${restaurantId}/cover-photo`, formData);
  }

  deleteUser(userId: number, password: string): Observable<any> {
    return this.http.request<any>('delete', `${this.apiUrl}/users/${userId}`, {
      body: { password }
    });
  }

  deactivateRestaurant(restaurantId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/restaurants/${restaurantId}/deactivate`, {});
  }

  deleteRestaurant(restaurantId: number, password: string): Observable<any> {
    return this.http.request<any>('delete', `${this.apiUrl}/restaurants/${restaurantId}`, {
      body: { password }
    });
  }

  activateRestaurant(restaurantId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/restaurants/${restaurantId}/activate`, {});
  }


  private adminHeaders() {
    const token = this.getToken();
    const headers: any = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  getAdminStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/admin/stats`, {
      headers: this.adminHeaders()
    });
  }

  getAdminRestaurants(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/restaurants`, {
      headers: this.adminHeaders()
    });
  }

  adminActivateRestaurant(id: number): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/restaurants/${id}/activate`, {},
      { headers: this.adminHeaders() }
    );
  }

  adminDeactivateRestaurant(id: number): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/restaurants/${id}/deactivate`, {},
      { headers: this.adminHeaders() }
    );
  }

  adminDeleteRestaurant(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/admin/restaurants/${id}`,
      { headers: this.adminHeaders() }
    );
  }

  getAdminUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`, {
      headers: this.adminHeaders()
    });
  }

  adminChangeUserRole(id: number, role: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/admin/users/${id}/role`,
      { role },
      { headers: this.adminHeaders() }
    );
  }

  adminDeleteUser(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/admin/users/${id}`,
      { headers: this.adminHeaders() }
    );
  }

  getAdminReservations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/reservations`, {
      headers: this.adminHeaders()
    });
  }

  getAdminReviews(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/reviews`, {
      headers: this.adminHeaders()
    });
  }

  adminDeleteReview(id: number): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/admin/reviews/${id}`,
      { headers: this.adminHeaders() }
    );
  }

  createCity(city: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/admin/cities`, city, {
      headers: this.adminHeaders()
    });
  }

  updateCity(id: number, city: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/admin/cities/${id}`, city, {
      headers: this.adminHeaders()
    });
  }

  deleteCity(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/admin/cities/${id}`, {
      headers: this.adminHeaders()
    });
  }

  adminChangeReservationStatus(id: number, status: string): Observable<any> {
    const adminId = this.getCurrentUserId();
    return this.http.patch<any>(
      `${this.apiUrl}/reservations/${id}/status`,
      { status, userId: adminId },
      { headers: this.adminHeaders() }
    );
  }

  adminCancelReservation(id: number): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/reservations/${id}/cancel`, {},
      { headers: this.adminHeaders() }
    );
  }

  adminUpdateReservationNote(id: number, note: string): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/admin/reservations/${id}/note`,
      { note },
      { headers: this.adminHeaders() }
    );
  }

  getAdminSettings(): Observable<Record<string, string>> {
    return this.http.get<Record<string, string>>(
      `${this.apiUrl}/admin/settings`,
      { headers: this.adminHeaders() }
    );
  }

  updateAdminSettings(updates: Record<string, string>): Observable<Record<string, string>> {
    return this.http.patch<Record<string, string>>(
      `${this.apiUrl}/admin/settings`,
      updates,
      { headers: this.adminHeaders() }
    );
  }

  getDepositSettings(restaurantId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/deposit-settings/restaurant/${restaurantId}`);
  }

  saveDepositSettings(restaurantId: number, payload: {
    requiresDeposit: boolean;
    depositAmount: number | null;
    minPartySizeForDeposit: number | null;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/deposit-settings/restaurant/${restaurantId}`,
      payload
    );
  }

  getBatchDeposits(restaurantIds: number[]): Observable<Record<string, number>> {
    return this.http.post<Record<string, number>>(
      `${this.apiUrl}/deposit-settings/batch`,
      { restaurantIds }
    );
  }

  fetchCurrentUserFromApi(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/users/me`, {
      withCredentials: true
    });
  }

  createRestaurantForOwner(
    ownerId: number,
    payload: { name: string; address?: string; cityName?: string; cuisineType?: string; phone?: string; }
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/restaurants/owner/${ownerId}`, payload);
  }
}
