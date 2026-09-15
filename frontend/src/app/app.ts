import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router, NavigationEnd, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs/operators';
import { SettingsService } from './services/settings.service';
import { AnnouncementBanner } from './announcement-banner/announcement-banner';
import { MaintenancePage } from './maintenance-page/maintenance-page';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, AnnouncementBanner, MaintenancePage],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  title = 'DineAhead';

  maintenanceEnabled = false;
  maintenanceMessage = '';
  isAdminRoute = false;

  constructor(
    private router: Router,
    private settings: SettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        setTimeout(() => {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
          document.documentElement.scrollTop = 0;
          document.body.scrollTop = 0;
          const main = document.querySelector('main') as HTMLElement | null;
          if (main) main.scrollTop = 0;
        });
        this.updateAdminRoute();
        this.cdr.detectChanges();
      });

    this.updateAdminRoute();

    this.settings.load().then(() => {
      this.applyMaintenance();
      this.settings.stream$.subscribe(() => {
        this.applyMaintenance();
        this.cdr.detectChanges();
      });
    });
  }

  private updateAdminRoute(): void {
    this.isAdminRoute = this.router.url.startsWith('/platform-admin');
  }

  private applyMaintenance(): void {
    const m = this.settings.maintenance;
    console.log('[App] maintenance settings:', m);
    this.maintenanceEnabled = m.enabled;
    this.maintenanceMessage = m.message;
  }
}
