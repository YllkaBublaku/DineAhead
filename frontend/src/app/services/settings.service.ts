import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, firstValueFrom } from 'rxjs';

export interface PlatformSettings {
  'announcement.message'?: string;
  'announcement.type'?: 'off' | 'info' | 'warning';
  'feature.reservations'?: string;
  'feature.reviews'?: string;
  'feature.deposits'?: string;
  'feature.favorites'?: string;
  'feature.signup.user'?: string;
  'feature.signup.restaurant'?: string;
  'maintenance.enabled'?: string;
  'maintenance.message'?: string;
  'contact.email'?: string;
  'contact.phone'?: string;
  'contact.address'?: string;
  [key: string]: string | undefined;
}

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private apiUrl = 'http://localhost:8080/api';
  private settings$ = new BehaviorSubject<PlatformSettings>({});
  private loaded = false;

  constructor(private http: HttpClient) {}

  async load(force = false): Promise<void> {
    if (this.loaded && !force) return;

    try {
      const s = await firstValueFrom(
        this.http.get<PlatformSettings>(`${this.apiUrl}/settings/public`)
      );
      console.log('[SettingsService] loaded:', s);
      this.settings$.next(s || {});
      this.loaded = true;
    } catch (err) {
      console.warn('[SettingsService] could not load settings', err);
      this.settings$.next({});
      this.loaded = true;
    }
  }

  get stream$(): Observable<PlatformSettings> {
    return this.settings$.asObservable();
  }

  get current(): PlatformSettings {
    return this.settings$.value;
  }

  isEnabled(key: string, defaultOn = true): boolean {
    const val = this.current[key];
    if (val === undefined) return defaultOn;
    return val === 'true';
  }

  get announcement(): { message: string; type: 'off' | 'info' | 'warning' } {
    const type = (this.current['announcement.type'] as any) || 'off';
    return {
      message: this.current['announcement.message'] || '',
      type
    };
  }

  get maintenance(): { enabled: boolean; message: string } {
    return {
      enabled: this.current['maintenance.enabled'] === 'true',
      message: this.current['maintenance.message'] || "We'll be back soon."
    };
  }

  get contact() {
    return {
      email: this.current['contact.email'] || '',
      phone: this.current['contact.phone'] || '',
      address: this.current['contact.address'] || ''
    };
  }
}
