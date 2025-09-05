import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-education',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './education.component.html',
  styleUrls: ['./education.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EducationComponent {
  settings = inject(SettingsService);
  private sanitizer = inject(DomSanitizer);
  private seo = inject(SeoService);
  private route = inject(ActivatedRoute);

  get slug(): string | null { return this.route.snapshot.paramMap.get('slug'); }

  constructor() {
    const slug = this.slug;
    const heading = this.settings.value.education?.heading || 'HVAC Education & Tips';
    if (!slug) {
      this.seo.setTitle(`${heading} — SV HVAC`);
      this.seo.setCanonical('/education');
      const desc = this.settings.value.education?.subheading || 'Simple how‑tos to help your system run better.';
      if (desc) this.seo.setDescription(desc);
    } else {
      const v = this.videos().find(x => this.slugify(x) === slug);
      const title = v?.title || 'HVAC Education Video';
      this.seo.setTitle(`${title} — SV HVAC`);
      this.seo.setCanonical(`/education/${slug}`);
      if (v?.description) this.seo.setDescription(v.description);
    }
  }

  embedUrl(url: string): SafeResourceUrl {
    try {
      const u = new URL(url);
      // Handle youtu.be and youtube.com
      let id = '';
      if (u.hostname.includes('youtu.be')) {
        id = u.pathname.replace('/', '');
      } else if (u.hostname.includes('youtube.com')) {
        if (u.searchParams.get('v')) id = u.searchParams.get('v') as string;
        const parts = u.pathname.split('/');
        const idx = parts.indexOf('embed');
        if (!id && idx !== -1 && parts[idx+1]) id = parts[idx+1];
      }
      if (!id) return this.sanitizer.bypassSecurityTrustResourceUrl(url);
      const embed = `https://www.youtube.com/embed/${id}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embed);
    } catch {
      return this.sanitizer.bypassSecurityTrustResourceUrl(url);
    }
  }

  private videoId(url: string): string {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) return u.pathname.replace('/', '');
      if (u.hostname.includes('youtube.com')) return (u.searchParams.get('v') || '').toString();
    } catch {}
    return '';
  }

  slugify(v: { url: string; title?: string }): string {
    const base = (v.title || this.videoId(v.url) || 'video').toLowerCase().trim();
    return base.replace(/&/g,'and').replace(/[^a-z0-9\s-]/g,'').replace(/[\s_-]+/g,'-').replace(/^-+|-+$/g,'');
  }

  videos() {
    return (this.settings.value.education?.videos || []) as Array<{ url: string; title?: string; description?: string }>;
  }

  get activeVideo() {
    const slug = this.slug;
    if (!slug) return null;
    return this.videos().find(v => this.slugify(v) === slug) || null;
  }
}
