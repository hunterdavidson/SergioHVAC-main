import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-blog-post',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './blog-post.component.html',
  styleUrls: ['./blog-post.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BlogPostComponent {
  private route = inject(ActivatedRoute);
  settings = inject(SettingsService);
  private seo = inject(SeoService);

  get slug(): string { return (this.route.snapshot.paramMap.get('slug') || '').toLowerCase(); }

  get post() {
    return (this.settings.value.blog?.posts || []).find(p => (p.slug || '').toLowerCase() === this.slug);
  }

  get related() {
    const p = this.post;
    if (!p) return [] as any[];
    const tags = new Set((p.tags || []).map(t => String(t).toLowerCase()));
    if (!tags.size) return [] as any[];
    const all = (this.settings.value.blog?.posts || []).filter(x => x && x.slug !== p.slug && (x.published !== false));
    const scored = all.map(x => ({
      post: x,
      score: (x.tags || []).reduce((acc, t) => acc + (tags.has(String(t).toLowerCase()) ? 1 : 0), 0)
    })).filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(x => x.post);
    return scored;
  }

  constructor() {
    const p = this.post;
    const title = p?.title || 'Blog Post';
    this.seo.setTitle(`${title} — SV HVAC`);
    this.seo.setCanonical(`/blog/${this.slug}`);
    const desc = p?.summary || (p?.contentHtml || '').toString().replace(/<[^>]+>/g,' ').trim().slice(0, 160);
    if (desc) this.seo.setDescription(desc);
    const site = 'https://svhvac.com';
    if (p?.heroUrl) {
      this.seo.setOg({ title: `${title} — SV HVAC`, description: desc, url: site + `/blog/${this.slug}`, image: p.heroUrl, imageAlt: p.title || 'Blog image', type: 'article', siteName: 'SV HVAC', locale: 'en_US' });
      this.seo.setTwitter({ card: 'summary_large_image', title: `${title} — SV HVAC`, description: desc, image: p.heroUrl, imageAlt: p.title || 'Blog image' });
    }
    // JSON-LD
    this.seo.upsertJsonLd('ld-blogpost', {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: title,
      description: desc,
      image: p?.heroUrl,
      datePublished: p?.date,
      author: { '@type': 'Person', name: p?.author || 'SV HVAC' },
      publisher: { '@type': 'Organization', name: 'SV HVAC' },
      mainEntityOfPage: site + `/blog/${this.slug}`,
    });
  }
}
