import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
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

  ngOnInit(): void {
    // If a hero image is configured, hint the browser to preload it for LCP
    const url = this.heroUrl;
    if (url && typeof document !== 'undefined') {
      try {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = url;
        document.head.appendChild(link);
      } catch {}
    }
  }
}
