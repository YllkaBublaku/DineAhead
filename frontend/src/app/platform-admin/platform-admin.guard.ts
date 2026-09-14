import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { RoleService } from '../services/role.service';

@Injectable({ providedIn: 'root' })
export class PlatformAdminGuard implements CanActivate {
  constructor(private router: Router, private roles: RoleService) {}

  canActivate(): boolean {
    if (this.roles.isPlatformAdmin()) return true;
    this.router.navigate(['/']);
    return false;
  }
}
