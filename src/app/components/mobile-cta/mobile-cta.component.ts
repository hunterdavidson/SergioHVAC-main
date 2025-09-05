import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-mobile-cta',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mobile-cta.component.html',
  styleUrls: ['./mobile-cta.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MobileCtaComponent {
  settings = inject(SettingsService);
  private router = inject(Router);
  get telHref(): string {
    const raw = this.settings.value.navbar?.phone || '';
    const digits = raw.replace(/[^0-9]/g,'');
    return digits ? `tel:${digits}` : '#';
  }

  get show(): boolean {
    const url = (this.router.url || '').toString();
    return !(url.startsWith('/admin') || url.startsWith('/estimate'));
  }
}
