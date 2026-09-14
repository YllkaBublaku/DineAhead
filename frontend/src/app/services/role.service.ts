import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class RoleService {
  getUser(): any | null {
    const raw = localStorage.getItem('user');
    if (!raw) return null;
    try { return JSON.parse(raw); } catch { return null; }
  }

  getRole(): string {
    const u = this.getUser();
    const r = u?.role || u?.roles?.[0] || u?.authority || u?.authorities?.[0] || '';
    return String(r).toUpperCase().replace(/^ROLE_/, '');
  }

  isPlatformAdmin(): boolean {
    return this.getRole() === 'PLATFORM_ADMIN';
  }

  isLoggedIn(): boolean {
    return !!this.getUser();
  }
}
