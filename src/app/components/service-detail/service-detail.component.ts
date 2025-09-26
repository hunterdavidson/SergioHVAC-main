import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';
import { ContactComponent } from '../contact/contact.component';
import { Subscription } from 'rxjs';

type ServiceKey = 'ac' | 'heat' | 'maintenance';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NgOptimizedImage, ContactComponent],
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailComponent implements OnInit, OnDestroy {
  private readonly palettes: Record<ServiceKey, { base: string; soft: string; contrast: string }> = {
    ac: { base: '#6c91c2', soft: '#e8eff7', contrast: '#5273a8' },
    heat: { base: '#ec5b56', soft: '#fdeceb', contrast: '#cf4a46' },
    maintenance: { base: '#1f8a70', soft: '#e6f4f0', contrast: '#166956' },
  };

  accentStyle: Record<string, string> = this.buildAccentStyle('ac');

  private route = inject(ActivatedRoute);
  public settings = inject(SettingsService);
  private seo = inject(SeoService);
  private paramSub?: Subscription;
  private currentKey: ServiceKey = 'ac';

  get key(): ServiceKey {
    return this.currentKey;
  }

  get page() {
    return this.settings.value.servicePages?.[this.key] || {} as any;
  }

  get heroUrl(): string | undefined {
    return this.page?.heroUrl;
  }

  get accentPalette() {
    return this.palettes[this.key];
  }

  private slugToKey(slug: string | null): ServiceKey {
    switch ((slug || '').toLowerCase()) {
      case 'heating':
      case 'heat':
      case 'furnace':
        return 'heat';
      case 'maintenance':
      case 'tune-up':
      case 'tuneups':
      case 'service-plan':
      case 'plan':
        return 'maintenance';
      default:
        return 'ac';
    }
  }

  private keyToSlug(key: ServiceKey): string {
    if (key === 'heat') return 'heating';
    if (key === 'maintenance') return 'maintenance';
    return 'ac';
  }

  private buildAccentStyle(key: ServiceKey): Record<string, string> {
    const palette = this.palettes[key];
    return {
      '--accent': palette.base,
      '--accent-soft': palette.soft,
      '--accent-contrast': palette.contrast,
    };
  }

  private handleRouteChange(slug: string | null): void {
    const nextKey = this.slugToKey(slug);
    this.currentKey = nextKey;
    this.accentStyle = this.buildAccentStyle(nextKey);
    this.updateSeo();
  }

  private updateSeo(): void {
    const heading = this.page?.heading || 'Service';
    const slug = this.keyToSlug(this.key);
    const path = `/services/${slug}`;
    this.seo.setTitle(`${heading} in Dallas-Fort Worth, TX | SV HVAC`);
    this.seo.setCanonical(path);

    let desc = (this.page?.subheading || (this.page?.body || '')).toString().trim();
    const phone = this.settings.value.navbar?.phone || '';
    if (phone) {
      const add = ` Call ${phone} for same-day service in DFW.`;
      desc = (desc + ' ' + add).trim();
    }
    desc = desc.slice(0, 160);
    this.seo.setDescription(desc);

    const site = 'https://svhvac.com';
    const images = [
      ...(this.page?.heroUrl ? [this.page.heroUrl] : []),
      ...((this.page?.gallery || []).map((g: any) => g?.url).filter(Boolean))
    ];
    const serviceType = this.key === 'ac' ? 'Air Conditioning Service'
      : this.key === 'heat' ? 'Heating Service'
      : 'HVAC Maintenance Service';

    const shareImage = images[0] || (site + '/assets/img/og-card.webp');
    const shareAlt = this.page?.heading || serviceType;
    this.seo.setOg({
      title: `${heading} in Dallas-Fort Worth, TX | SV HVAC`,
      description: desc,
      url: site + path,
      image: shareImage,
      imageAlt: shareAlt,
      type: 'website',
      siteName: 'SV HVAC',
      locale: 'en_US',
    });
    this.seo.setTwitter({
      card: 'summary_large_image',
      title: `${heading} in Dallas-Fort Worth, TX | SV HVAC`,
      description: desc,
      image: shareImage,
      imageAlt: shareAlt,
    });

    this.seo.upsertJsonLd('ld-breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site + '/' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: site + '/services' },
        { '@type': 'ListItem', position: 3, name: `${heading} in Dallas-Fort Worth`, item: site + path },
      ]
    });

    this.seo.upsertJsonLd('ld-service', {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType,
      name: this.page?.heading || serviceType,
      description: desc,
      image: images.length ? images : undefined,
      url: site + path,
      provider: {
        '@type': 'HVACBusiness',
        name: 'SV HVAC',
        url: site,
      },
      areaServed: {
        '@type': 'City',
        name: 'Dallas-Fort Worth',
        addressRegion: 'TX',
        addressCountry: 'US'
      }
    });

    const faqs = (this.page?.faqs || []).filter((q: any) => q?.q && q?.a).slice(0, 15);
    if (faqs.length) {
      this.seo.upsertJsonLd('ld-faq', {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map((f: any) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        }))
      });
    } else {
      this.seo.removeElement('ld-faq');
    }
  }

  solidButtonClass(): string {
    if (this.key === 'heat') return 'btn-service--heat';
    if (this.key === 'maintenance') return 'btn-service--maint';
    return 'btn-service--ac';
  }

  outlineButtonClass(): string {
    if (this.key === 'heat') return 'btn-service--outline-heat';
    if (this.key === 'maintenance') return 'btn-service--outline-maint';
    return 'btn-service--outline-ac';
  }

  trackByIdx(i: number) { return i; }

  ngOnInit(): void {
    this.paramSub = this.route.paramMap.subscribe(params => {
      this.handleRouteChange(params.get('slug'));
    });
  }

  // Simple lightbox state
  activeImage: { url: string; alt: string } | null = null;
  openImage(url?: string, alt?: string) {
    if (!url) return; this.activeImage = { url, alt: alt || '' };
  }
  closeImage() { this.activeImage = null; }

  ngOnDestroy(): void {
    this.paramSub?.unsubscribe();
    this.seo.removeElement('ld-service');
    this.seo.removeElement('ld-breadcrumbs');
    this.seo.removeElement('ld-faq');
  }
}
