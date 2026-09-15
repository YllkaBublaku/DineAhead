import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../services/settings.service';

@Component({
  selector: 'app-announcement-banner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './announcement-banner.html',
  styleUrl: './announcement-banner.css'
})
export class AnnouncementBanner implements OnInit {
  message = '';
  type: 'off' | 'info' | 'warning' = 'off';

  constructor(
    private settings: SettingsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.settings.load().then(() => {
      this.refresh();
      this.settings.stream$.subscribe(() => {
        this.refresh();
        this.cdr.detectChanges();
      });
    });
  }

  private refresh(): void {
    const a = this.settings.announcement;
    console.log('[Banner] announcement:', a);
    this.message = a.message;
    this.type = a.type;
  }

  get bannerClass(): string {
    if (this.type === 'warning') {
      return 'bg-amber-100 text-amber-900 border-b border-amber-200';
    }
    return 'bg-[#0f172a] text-white';
  }
}
