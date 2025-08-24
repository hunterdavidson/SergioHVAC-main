import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  constructor(public settings: SettingsService) {}

  get heroUrl(): string | null {
    // SettingsService already hydrates a public URL for the hero image when a path exists
    // so we can just use it directly without calling storage here.
    return this.settings.value.home?.heroUrl || null;
  }

  get headline(): string | null {
    return this.settings.value.home?.headline || null;
  }

  get subhead(): string | null {
    return this.settings.value.home?.subhead || null;
  }

  get ctaText(): string | null {
    return this.settings.value.home?.ctaText || null;
  }
}