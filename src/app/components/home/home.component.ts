import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, NgOptimizedImage, RouterLink],
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
    return this.toPlainText(this.settings.value.home?.headline);
  }

  get subhead(): string | null {
    return this.toPlainText(this.settings.value.home?.subhead);
  }

  get ctaText(): string | null {
    return this.toPlainText(this.settings.value.home?.ctaText);
  }

  private toPlainText(value?: string | null): string | null {
    if (value == null) return null;
    let raw = typeof value === 'string' ? value : String(value);
    raw = raw.trim();
    if (!raw) return null;

    raw = this.resolveMoustacheFallback(raw) || raw;

    const deltaText = this.extractDelta(raw);
    if (deltaText !== null) {
      raw = deltaText;
    }

    if (typeof document === 'undefined') {
      return this.stripHtml(raw);
    }

    return this.stripHtml(raw);
  }

  private resolveMoustacheFallback(raw: string): string | null {
    if (!raw.includes('{{') || !raw.includes('}}')) {
      return null;
    }

    const interpolation = raw.match(/\{\{\s*([\s\S]+?)\s*\}\}/);
    if (interpolation?.[1]) {
      const inner = interpolation[1];
      const parts = inner.split('||').map(part => part.trim()).filter(Boolean);
      for (let i = parts.length - 1; i >= 0; i--) {
        const candidate = parts[i];
        const cleaned = candidate.replace(/^[\u0060'"Â´â€˜â€™â€œâ€]+|[\u0060'"Â´â€˜â€™â€œâ€]+$/g, '').trim();
        if (!cleaned) {
          continue;
        }
        if (/^[a-z0-9_.$?]+$/i.test(cleaned)) {
          continue;
        }
        return cleaned;
      }
    }

    const fallbackSingle = raw.match(/\|\|\s*'((?:\'|[^'])+)'/);
    if (fallbackSingle?.[1]) {
      return fallbackSingle[1].replace(/\'/g, "'");
    }
    const fallbackDouble = raw.match(/\|\|\s*"((?:\"|[^"])+)"/);
    if (fallbackDouble?.[1]) {
      return fallbackDouble[1].replace(/\"/g, '"');
    }

    if (interpolation?.[1]) {
      const stripped = interpolation[1].replace(/[{}]/g, '').trim();
      return stripped || null;
    }

    return raw.replace(/[{}]/g, '').trim() || null;
  }

  private stripHtml(input: string): string | null {
    const el = typeof document !== 'undefined' ? document.createElement('div') : null;
    if (el) {
      el.innerHTML = input;
      const text = (el.textContent || el.innerText || '').replace(/\s+/g, ' ').trim();
      if (text) {
        return text;
      }
    }
    const fallback = input.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    return fallback || null;
  }

  private extractDelta(raw: string): string | null {
    const first = raw[0];
    if (first !== '{' && first !== '[') {
      return null;
    }
    try {
      const parsed: any = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.ops)) {
        return this.deltaToPlain(parsed.ops);
      }
      if (Array.isArray(parsed) && parsed.every(item => item && typeof item.insert !== 'undefined')) {
        return this.deltaToPlain(parsed as Array<{ insert?: any }>);
      }
    } catch {
      return null;
    }
    return null;
  }

  private deltaToPlain(ops: Array<{ insert?: any }>): string {
    const stitched = ops.map(op => (typeof op?.insert === 'string' ? op.insert : '')).join('');
    return stitched.replace(/\s+/g, ' ').trim();
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


