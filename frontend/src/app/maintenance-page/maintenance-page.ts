import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-maintenance-page',
  standalone: true,
  templateUrl: './maintenance-page.html',
  styleUrl: './maintenance-page.css'
})
export class MaintenancePage {
  @Input() message = "We'll be back soon.";
}
