import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {Observable} from 'rxjs';

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

  getCurrentUser(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`, {
      withCredentials: true
    });
  }

  getRestaurants(): Promise<any[]> {
    return fetch('http://localhost:8080/api/restaurants')
      .then(response => {
        if (!response.ok) throw new Error('Failed to fetch restaurants');
        return response.json();
      });
  }
}
