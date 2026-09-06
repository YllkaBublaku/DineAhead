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

  getRestaurantsByOwner(ownerId: number): Promise<any[]> {
    return firstValueFrom(
      this.http.get<any[]>(`${this.apiUrl}/restaurants/owner/${ownerId}`)
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
        status: 'PENDING'
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
      console.log('Reservation created:', result);
      return result;
    } catch (error) {
      console.error('Reservation error:', error);
      throw error;
    }
  }
}
