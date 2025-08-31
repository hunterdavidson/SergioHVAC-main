import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/settings.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './about.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
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

  trackByIdx(index: number): number {
    return index;
  }
}
