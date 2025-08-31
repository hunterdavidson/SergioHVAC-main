import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';

type ServiceKey = 'ac' | 'heat' | 'maintenance';

@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, NgOptimizedImage],
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceDetailComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  public settings = inject(SettingsService);
  private seo = inject(SeoService);

  get key(): ServiceKey {
    const dataKey = (this.route.snapshot.data?.['serviceKey'] || 'ac') as ServiceKey;
    return (['ac','heat','maintenance'] as const).includes(dataKey) ? dataKey : 'ac';
  }

  get page() {
    return this.settings.value.servicePages?.[this.key] || {} as any;
  }

  get heroUrl(): string | undefined {
    return this.page?.heroUrl;
  }

  colorByKey(): string {
    return this.key === 'heat' ? '#E64545' : '#6C91C2';
  }

  trackByIdx(i: number) { return i; }

  ngOnInit(): void {
    const heading = this.page?.heading || 'Service';
    this.seo.setTitle(`${heading} — SV HVAC`);
    const path = this.key === 'ac' ? '/services/ac'
      : this.key === 'heat' ? '/services/heating'
      : '/services/maintenance';
    this.seo.setCanonical(path);
    // Meta description prefers subheading, then trimmed body
    const desc = (this.page?.subheading || (this.page?.body || '')).toString().trim().slice(0, 160);
    if (desc) this.seo.setDescription(desc);

    // JSON-LD for Service
    const site = 'https://svhvac.com';
    const images = [
      ...(this.page?.heroUrl ? [this.page.heroUrl] : []),
      ...((this.page?.gallery || []).map((g: any) => g?.url).filter(Boolean))
    ];
    const serviceType = this.key === 'ac' ? 'Air Conditioning Service'
      : this.key === 'heat' ? 'Heating Service'
      : 'HVAC Maintenance Service';

    // Dynamic Open Graph + Twitter Card
    const shareImage = images[0] || (site + '/assets/img/og-card.webp');
    const shareAlt = this.page?.heading || serviceType;
    this.seo.setOg({
      title: `${heading} — SV HVAC`,
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
      title: `${heading} — SV HVAC`,
      description: desc,
      image: shareImage,
      imageAlt: shareAlt,
    });

    // Breadcrumbs JSON‑LD
    this.seo.upsertJsonLd('ld-breadcrumbs', {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: site + '/' },
        { '@type': 'ListItem', position: 2, name: 'Services', item: site + '/#services' },
        { '@type': 'ListItem', position: 3, name: heading, item: site + path },
      ]
    });

    // Service JSON‑LD
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
        name: 'Grapevine',
        addressRegion: 'TX',
        addressCountry: 'US'
      }
    });
  }

  // Simple lightbox state
  activeImage: { url: string; alt: string } | null = null;
  openImage(url?: string, alt?: string) {
    if (!url) return; this.activeImage = { url, alt: alt || '' };
  }
  closeImage() { this.activeImage = null; }

  ngOnDestroy(): void {
    this.seo.removeElement('ld-service');
    this.seo.removeElement('ld-breadcrumbs');
  }
}
