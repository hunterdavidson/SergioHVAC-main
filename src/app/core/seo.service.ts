import { Injectable, inject } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

@Injectable({ providedIn: 'root' })
export class SeoService {
  private meta = inject(Meta);
  private titleSvc = inject(Title);

  setTitle(title: string) {
    try { this.titleSvc.setTitle(title); } catch {}
  }

  setRobots(content: string) {
    try { this.meta.updateTag({ name: 'robots', content }); } catch {}
  }

  setDescription(desc: string) {
    try { this.meta.updateTag({ name: 'description', content: desc }); } catch {}
  }

  // ---- Open Graph / Twitter helpers ----
  private upsertName(name: string, content: string | undefined) {
    if (!content) return;
    try { this.meta.updateTag({ name, content }); } catch {}
  }

  private upsertProp(property: string, content: string | undefined) {
    if (!content) return;
    try { this.meta.updateTag({ property, content }); } catch {}
  }

  setOg(input: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    imageAlt?: string;
    imageWidth?: string | number;
    imageHeight?: string | number;
    type?: string;           // e.g. 'website', 'article'
    siteName?: string;
    locale?: string;         // e.g. 'en_US'
  }) {
    this.upsertProp('og:type', input.type || 'website');
    this.upsertProp('og:title', input.title || '');
    this.upsertProp('og:description', input.description || '');
    this.upsertProp('og:url', input.url || '');
    this.upsertProp('og:image', input.image || '');
    this.upsertProp('og:image:alt', input.imageAlt || '');
    this.upsertProp('og:site_name', input.siteName || '');
    if (input.imageWidth != null) this.upsertProp('og:image:width', String(input.imageWidth));
    if (input.imageHeight != null) this.upsertProp('og:image:height', String(input.imageHeight));
    if (input.locale) this.upsertProp('og:locale', input.locale);
  }

  setTwitter(input: {
    card?: 'summary' | 'summary_large_image';
    title?: string;
    description?: string;
    image?: string;
    imageAlt?: string;
    site?: string;        // @handle or site name
    creator?: string;     // @creator handle
  }) {
    this.upsertName('twitter:card', input.card || 'summary_large_image');
    this.upsertName('twitter:title', input.title || '');
    this.upsertName('twitter:description', input.description || '');
    this.upsertName('twitter:image', input.image || '');
    this.upsertName('twitter:image:alt', input.imageAlt || '');
    if (input.site) this.upsertName('twitter:site', input.site);
    if (input.creator) this.upsertName('twitter:creator', input.creator);
  }

  setOgUrl(url: string) { this.upsertProp('og:url', url); }
  setOgImage(url: string, alt?: string) {
    this.upsertProp('og:image', url);
    if (alt) this.upsertProp('og:image:alt', alt);
  }

  setCanonical(path?: string) {
    try {
      const doc = document;
      const head = doc.head;
      let link = head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
      if (!link) {
        link = doc.createElement('link');
        link.setAttribute('rel', 'canonical');
        head.appendChild(link);
      }
      const base = location.origin;
      link.href = path ? (base + path) : location.href;
    } catch {}
  }

  private upsertMeta(attr: 'name' | 'property' | 'httpEquiv', key: string, content: string) {
    try {
      this.meta.updateTag({ [attr]: key, content } as any);
    } catch {}
  }

  /**
   * Update Open Graph and Twitter Card tags for share previews.
   */
  setSocialTags(opts: {
    title?: string;
    description?: string;
    url?: string;
    image?: string;
    imageAlt?: string;
  }) {
    try {
      const { title, description, url, image, imageAlt } = opts || {};
      if (title) {
        this.upsertMeta('property', 'og:title', title);
        this.upsertMeta('name', 'twitter:title', title);
      }
      if (description) {
        this.upsertMeta('property', 'og:description', description);
        this.upsertMeta('name', 'twitter:description', description);
      }
      if (url) this.upsertMeta('property', 'og:url', url);
      if (image) {
        this.upsertMeta('property', 'og:image', image);
        this.upsertMeta('name', 'twitter:image', image);
      }
      if (imageAlt) this.upsertMeta('property', 'og:image:alt', imageAlt);
      // Ensure card type remains large image
      this.upsertMeta('name', 'twitter:card', 'summary_large_image');
    } catch {}
  }

  upsertJsonLd(id: string, data: unknown) {
    try {
      const doc = document;
      let el = doc.getElementById(id) as HTMLScriptElement | null;
      if (!el) {
        el = doc.createElement('script');
        el.type = 'application/ld+json';
        el.id = id;
        doc.head.appendChild(el);
      }
      el.text = JSON.stringify(data);
    } catch {}
  }

  removeElement(id: string) {
    try {
      const el = document.getElementById(id);
      if (el?.parentElement) el.parentElement.removeChild(el);
    } catch {}
  }
}
