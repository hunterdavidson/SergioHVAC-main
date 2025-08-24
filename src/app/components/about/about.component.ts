import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html'
})
export class AboutComponent {
  constructor(public settings: SettingsService) {}

  get heading(): string {
    return this.settings.value?.about?.heading || 'About Us';
  }

  get subheading(): string {
    return this.settings.value?.about?.subheading || 'Learn more about our journey and vision.';
  }

  get items() {
    return this.settings.value?.about?.items?.filter(it => !it.hidden) ?? [];
  }

  colorBg(color?: 'blue'|'red') {
    if (color === 'red') return '#E64545';
    return '#6C91C2';
  }

  iconClass(icon?: string) {
    return icon?.trim() || 'fa-solid fa-star';
  }
}