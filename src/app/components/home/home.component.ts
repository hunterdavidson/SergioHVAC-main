import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HomeComponent implements OnInit {
  constructor(public settings: SettingsService) {}

  private readonly staticHeroUrl = '/assets/img/hero-image.webp';

  get heroUrl(): string {
    // Hero now uses a fixed local asset so it stays consistent across deployments.
    return this.staticHeroUrl;
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
    // Preload the hero image so it is ready for the first paint.
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
