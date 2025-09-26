import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  private settings = inject(SettingsService);

  trackByIndex(index: number): number {
    return index;
  }

  get footer() {
    return this.settings.value.footer;
  }

  get currentYear(): number {
    return new Date().getFullYear();
  }

  isInternal(url?: string | null): boolean {
    return !!url && url.startsWith('/');
  }

  phoneHref(phone?: string | null): string | null {
    if (!phone) return null;
    const digits = phone.replace(/[^0-9]/g, '');
    return digits ? `tel:${digits}` : null;
  }

  formatText(value?: string | null): string {
    if (!value) return '';
    return value
      .replace(/[\u2012-\u2015\u2212]/g, '-')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
