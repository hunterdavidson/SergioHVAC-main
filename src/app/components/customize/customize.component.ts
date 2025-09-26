import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService, SiteSettings, TeamMember } from '../../core/settings.service';
import { supabase } from '../../core/supabase.client';
import { SeoService } from '../../core/seo.service';

const SECTION_KEYS = [
  'navbar',
  'home',
  'services',
  'servicePages',
  'about',
  'team',
  'contact',
  'footer',
  'legal',
  'reviews',
  'education',
  'blog',
  'plans',
  'estimate',
] as const;

type SectionKey = (typeof SECTION_KEYS)[number];

@Component({
  selector: 'app-customize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customize.component.html',
  styleUrls: ['./customize.component.scss'],
})
export class CustomizeComponent implements OnInit, OnDestroy {
  private settingsSvc = inject(SettingsService);
  private seo = inject(SeoService);

  loading = true;
  error = '';
  saving = false;
  saveError = '';
  saveOk = false;

  // The editable copy
  draft!: SiteSettings;

  // Track open/closed state for each admin section dropdown
  private sectionState: Record<SectionKey, boolean> = SECTION_KEYS.reduce(
    (acc, key) => {
      acc[key] = false;
      return acc;
    },
    {} as Record<SectionKey, boolean>
  );

  isSectionOpen(key: SectionKey): boolean {
    return !!this.sectionState[key];
  }

  toggleSection(key: SectionKey) {
    this.sectionState[key] = !this.sectionState[key];
  }

  private subSectionState: Record<string, boolean> = {};

  isSubSectionOpen(section: SectionKey, subKey: string): boolean {
    return !!this.subSectionState[this.composeSubSectionKey(section, subKey)];
  }

  toggleSubSection(section: SectionKey, subKey: string) {
    const key = this.composeSubSectionKey(section, subKey);
    this.subSectionState[key] = !this.subSectionState[key];
  }

  private composeSubSectionKey(section: SectionKey, subKey: string): string {
    return `${section}::${subKey}`;
  }

  // --- Lifecycle -----------------------------------------------------------
  async ngOnInit() {
    // Keep this admin customization screen out of the index
    this.seo.setRobots('noindex,nofollow');
    try {
      await this.settingsSvc.load();
      this.draft = structuredClone(this.settingsSvc.value);
      this._normalizeDraft();
    } catch (e: any) {
      this.error = e?.message || 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  ngOnDestroy(): void {
    // Restore default robots for public pages
    this.seo.setRobots('index,follow,max-image-preview:large');
  }

  // --- Normalization -------------------------------------------------------
  private _normalizeDraft() {
    // Ensure arrays & navbar exist to keep template happy
    this.draft.about ||= { items: [] };
    this.draft.about.items ||= [];

    this.draft.team ||= { members: [] };
    this.draft.team.members ||= [];
    while (this.draft.team.members.length < 3) {
      this.draft.team.members.push({ name: '', role: '', icon: 'user', hidden: false });
    }

    this.draft.navbar ||= { phone: '(XXX) XXX-XXXX' };
    this.draft.home ||= { headline: '', subhead: '', ctaText: '' };

    const footer: any = this.draft.footer = (this.draft.footer as any) || { companyName: '', tagline: '', address: '', phone: '', email: '', legalNotice: '', links: [], social: [] };
    footer.links = footer.links || [];
    footer.social = footer.social || [];

    const legal: any = this.draft.legal = (this.draft.legal as any) || { privacy: { title: '', updatedOn: '', contentHtml: '' }, terms: { title: '', updatedOn: '', contentHtml: '' } };
    legal.privacy = legal.privacy || { title: '', updatedOn: '', contentHtml: '' };
    legal.terms = legal.terms || { title: '', updatedOn: '', contentHtml: '' };

    this.draft.reviews ||= { rating: 5.0, count: 0, googlePlaceId: '', googleReviewUrl: '', testimonials: [] } as any;
    this.draft.education ||= { heading: 'HVAC Education & Tips', subheading: 'How‑tos and maintenance tips', videos: [] } as any;
    this.draft.blog ||= { posts: [] } as any;

    // Ensure service pages exist with arrays
    this.draft.servicePages ||= {
      ac: { features: [], gallery: [] },
      heat: { features: [], gallery: [] },
      maintenance: { features: [], gallery: [] },
    } as any;
    for (const k of ['ac','heat','maintenance'] as const) {
      const p: any = (this.draft.servicePages as any)[k] || {};
      p.features ||= [];
      p.gallery ||= [];
      p.faqs ||= [];
      p.sections ||= [];
      while (p.gallery.length < 3) p.gallery.push({});
      (this.draft.servicePages as any)[k] = p;
    }

    // No cities list
  }

  // --- Save ---------------------------------------------------------------
  async save() {
    this.saving = true;
    this.saveError = '';

    try {
      // tiny sanitization
      if (this.draft.navbar?.phone) this.draft.navbar.phone = this.draft.navbar.phone.trim();
      if (Array.isArray(this.draft.footer?.links)) {
        this.draft.footer.links = this.draft.footer.links
          .map(link => ({
            label: (link?.label || '').trim(),
            url: (link?.url || '').trim(),
          }))
          .filter(link => link.label || link.url);
      }
      if (Array.isArray(this.draft.footer?.social)) {
        this.draft.footer.social = this.draft.footer.social
          .map(item => ({
            label: (item?.label || '').trim(),
            url: (item?.url || '').trim(),
            icon: (item?.icon || '').trim(),
          }))
          .filter(item => item.label || item.url);
      }
      if (this.draft.legal?.privacy) {
        this.draft.legal.privacy.title = (this.draft.legal.privacy.title || '').trim();
        this.draft.legal.privacy.updatedOn = (this.draft.legal.privacy.updatedOn || '').trim();
        this.draft.legal.privacy.contentHtml = (this.draft.legal.privacy.contentHtml || '').trim();
      }
      if (this.draft.legal?.terms) {
        this.draft.legal.terms.title = (this.draft.legal.terms.title || '').trim();
        this.draft.legal.terms.updatedOn = (this.draft.legal.terms.updatedOn || '').trim();
        this.draft.legal.terms.contentHtml = (this.draft.legal.terms.contentHtml || '').trim();
      }

      // Persist
      await this.settingsSvc.save(this.draft);
      this.saveOk = true;
      setTimeout(() => (this.saveOk = false), 1500);

      // Update local snapshot as the truth
      this.draft = structuredClone(this.settingsSvc.value);
    } catch (e: any) {
      this.saveError = e?.message || 'Failed to save settings';
    } finally {
      this.saving = false;
    }
  }

  addFooterLink() {
    const footer: any = this.draft.footer;
    footer.links = footer.links || [];
    footer.links.push({ label: '', url: '' });
  }

  removeFooterLink(idx: number) {
    const footer: any = this.draft.footer;
    footer.links = footer.links || [];
    footer.links.splice(idx, 1);
  }

  addFooterSocial() {
    const footer: any = this.draft.footer;
    footer.social = footer.social || [];
    footer.social.push({ label: '', url: '', icon: '' });
  }

  removeFooterSocial(idx: number) {
    const footer: any = this.draft.footer;
    footer.social = footer.social || [];
    footer.social.splice(idx, 1);
  }

  // --- FAQs helpers -------------------------------------------------------
  addServiceFaq(key: 'ac'|'heat'|'maintenance') {
    const page: any = (this.draft.servicePages as any)[key] || {};
    page.faqs ||= [];
    page.faqs.push({ q: '', a: '' });
    (this.draft.servicePages as any)[key] = page;
  }

  removeServiceFaq(key: 'ac'|'heat'|'maintenance', idx: number) {
    const page: any = (this.draft.servicePages as any)[key] || {};
    if (!page.faqs) return;
    page.faqs.splice(idx, 1);
  }

  // Removed city helpers

  // --- Hero image upload/remove ------------------------------------------
  async onHeroSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `hero/hero-${Date.now()}.${ext}`;

    // Remove previous from storage if exists
    if (this.draft.home.heroPath) {
      await this._removeStorageQuiet(this.draft.home.heroPath);
    }

    const { error: upErr } = await supabase.storage.from('assets').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (upErr) {
      console.error('Upload failed', upErr);
      alert('Upload failed: ' + upErr.message);
      return;
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    this.draft.home.heroPath = path;
    this.draft.home.heroUrl = data?.publicUrl;

    await this.save();
    // clear input for reselect
    input.value = '';
  }

  async clearHero() {
    const has = !!(this.draft.home.heroPath || this.draft.home.heroUrl);
    if (!has) return;

    const ok = confirm('Are you sure you want to remove the hero image? This will delete the file from Supabase.');
    if (!ok) return;

    let removed = false;
    if (this.draft.home.heroPath) {
      removed = await this._removeStorageQuiet(this.draft.home.heroPath);
    } else if (this.draft.home.heroUrl) {
      const key = this._pathFromPublicUrl(this.draft.home.heroUrl);
      if (key) removed = await this._removeStorageQuiet(key);
    }

    if (!removed) {
      // Surface a message so you know why it "didn't delete"
      alert('Could not delete hero image from storage. Check storage policies and console for details.');
    }

    this.draft.home.heroPath = undefined;
    this.draft.home.heroUrl = undefined;

    await this.save();
  }

  // --- Team photo upload/remove ------------------------------------------
  async onTeamSelected(evt: Event, idx: number) {
    const member = this.draft.team.members[idx];
    if (!member) return;

    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `team/member-${idx}-${Date.now()}.${ext}`;

    if (member.photoPath) await this._removeStorageQuiet(member.photoPath);

    const { error: upErr } = await supabase.storage.from('assets').upload(path, file, {
      cacheControl: '3600',
      upsert: true,
    });
    if (upErr) {
      console.error('Upload failed', upErr);
      alert('Upload failed: ' + upErr.message);
      return;
    }

    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    member.photoPath = path;
    member.photoUrl = data?.publicUrl;

    await this.save();
    input.value = '';
  }

  async clearTeamPhoto(idx: number) {
    const member = this.draft.team.members[idx];
    if (!member) return;

    const ok = confirm(`Remove ${member.name || 'this member'}'s photo? This will delete the file from Supabase.`);
    if (!ok) return;

    let removed = false;
    if (member.photoPath) {
      removed = await this._removeStorageQuiet(member.photoPath);
    } else if (member.photoUrl) {
      const key = this._pathFromPublicUrl(member.photoUrl);
      if (key) removed = await this._removeStorageQuiet(key);
    }

    if (!removed) {
      alert(`Could not delete ${member.name || 'member'}'s photo from storage. Check storage policies and console for details.`);
    }

    member.photoPath = undefined;
    member.photoUrl = undefined;

    await this.save();
  }

  // --- Service pages: hero & gallery uploads -----------------------------
  private _svcKeys: Array<'ac'|'heat'|'maintenance'> = ['ac','heat','maintenance'];

  async onServiceHeroSelected(evt: Event, key: 'ac'|'heat'|'maintenance') {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const page = this.draft.servicePages?.[key];
    if (!page) return;

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `services/${key}/hero-${Date.now()}.${ext}`;

    if (page.heroPath) await this._removeStorageQuiet(page.heroPath);

    const { error: upErr } = await supabase.storage.from('assets').upload(path, file, {
      cacheControl: '3600', upsert: true,
    });
    if (upErr) { alert('Upload failed: ' + upErr.message); return; }

    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    page.heroPath = path; page.heroUrl = data?.publicUrl;
    await this.save();
    input.value = '';
  }

  async clearServiceHero(key: 'ac'|'heat'|'maintenance') {
    const page = this.draft.servicePages?.[key];
    if (!page) return;

    const ok = confirm('Remove this service hero image? This deletes the file from storage.');
    if (!ok) return;

    let removed = false;
    if (page.heroPath) removed = await this._removeStorageQuiet(page.heroPath);
    else if (page.heroUrl) {
      const keyPath = this._pathFromPublicUrl(page.heroUrl);
      if (keyPath) removed = await this._removeStorageQuiet(keyPath);
    }
    if (!removed) alert('Could not delete from storage. Check policies.');
    page.heroPath = undefined; page.heroUrl = undefined;
    await this.save();
  }

  async onServiceGallerySelected(evt: Event, key: 'ac'|'heat'|'maintenance', idx: number) {
    const page = this.draft.servicePages?.[key];
    if (!page) return;
    page.gallery ||= []; while (page.gallery.length <= idx) page.gallery.push({});
    const item = page.gallery[idx];

    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop() || 'jpg';
    const path = `services/${key}/gallery-${idx}-${Date.now()}.${ext}`;

    if (item.path) await this._removeStorageQuiet(item.path);

    const { error: upErr } = await supabase.storage.from('assets').upload(path, file, {
      cacheControl: '3600', upsert: true,
    });
    if (upErr) { alert('Upload failed: ' + upErr.message); return; }

    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    item.path = path; item.url = data?.publicUrl;
    await this.save();
    input.value = '';
  }

  async clearServiceGallery(key: 'ac'|'heat'|'maintenance', idx: number) {
    const page = this.draft.servicePages?.[key];
    if (!page || !page.gallery || !page.gallery[idx]) return;
    const item = page.gallery[idx];
    const ok = confirm('Remove this gallery image? This deletes the file from storage.');
    if (!ok) return;

    let removed = false;
    if (item.path) removed = await this._removeStorageQuiet(item.path);
    else if (item.url) {
      const keyPath = this._pathFromPublicUrl(item.url);
      if (keyPath) removed = await this._removeStorageQuiet(keyPath);
    }
    if (!removed) alert('Could not delete from storage.');
    item.path = undefined; item.url = undefined; item.alt = undefined;
    await this.save();
  }

  // --- Service pages: features add/remove -------------------------------
  addServiceFeature(key: 'ac'|'heat'|'maintenance') {
    const page = this.draft.servicePages?.[key];
    if (!page) return;
    page.features ||= [];
    page.features.push('');
  }

  removeServiceFeature(key: 'ac'|'heat'|'maintenance', idx: number) {
    const page = this.draft.servicePages?.[key];
    if (!page || !page.features) return;
    page.features.splice(idx, 1);
  }

  // --- Education helpers --------------------------------------------------
  addEducationVideo() {
    const edu: any = this.draft.education ?? (this.draft.education = { heading: '', subheading: '', videos: [] } as any);
    edu.videos = edu.videos || [];
    edu.videos.push({ url: '', title: '', description: '' });
  }
  removeEducationVideo(idx: number) {
    if (!this.draft.education?.videos) return;
    this.draft.education.videos.splice(idx, 1);
  }

  // --- Blog helpers -------------------------------------------------------
  addBlogPost() {
    const blog: any = this.draft.blog ?? (this.draft.blog = { posts: [] } as any);
    blog.posts = blog.posts || [];
    const today = new Date().toISOString().slice(0,10);
    blog.posts.push({ slug: 'new-post', title: 'New Post', date: today, summary: '', contentHtml: '', tags: [], published: false } as any);
  }
  onBlogTagsChange(idx: number, value: string) {
    const p = this.draft.blog?.posts?.[idx];
    if (!p) return;
    const arr = String(value || '')
      .split(',')
      .map((x: string) => x.trim())
      .filter((x: string) => !!x);
    (p as any).tags = arr;
  }

  // --- Plan helpers -------------------------------------------------------
  addPlanTier() {
    const plans: any = this.draft.plans ?? (this.draft.plans = { heading: '', subheading: '', tiers: [] } as any);
    plans.tiers = plans.tiers || [];
    plans.tiers.push({ name: 'New Tier', price: 0, interval: 'per visit', features: [], cta: 'Get Started' } as any);
  }
  addPlanFeature(idx: number) {
    const tier = this.draft.plans?.tiers?.[idx];
    if (!tier) return;
    tier.features ||= [];
    tier.features.push('');
  }

  // --- Blog hero upload/remove -------------------------------------------
  async onBlogHeroSelected(evt: Event, idx: number) {
    const post = this.draft.blog?.posts?.[idx];
    if (!post) return;
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const path = `blog/${post.slug || 'post'}-${Date.now()}.${ext}`;
    if (post.heroPath) await this._removeStorageQuiet(post.heroPath);
    const { error } = await supabase.storage.from('assets').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { alert('Upload failed: ' + error.message); return; }
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    post.heroPath = path; post.heroUrl = data?.publicUrl;
    await this.save();
    input.value = '';
  }

  async clearBlogHero(idx: number) {
    const post = this.draft.blog?.posts?.[idx];
    if (!post) return;
    const ok = confirm('Remove this blog hero image? This will delete the file from storage.');
    if (!ok) return;
    let removed = false;
    if (post.heroPath) removed = await this._removeStorageQuiet(post.heroPath);
    else if (post.heroUrl) {
      const keyPath = this._pathFromPublicUrl(post.heroUrl);
      if (keyPath) removed = await this._removeStorageQuiet(keyPath);
    }
    if (!removed) alert('Could not delete from storage.');
    post.heroPath = undefined; post.heroUrl = undefined;
    await this.save();
  }

  // --- Blog inline media upload ------------------------------------------
  async onBlogInlineSelected(evt: Event, idx: number) {
    const post: any = this.draft.blog?.posts?.[idx];
    if (!post) return;
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const ext = file.name.split('.').pop() || 'jpg';
    const safeSlug = (post.slug || 'post').replace(/[^a-z0-9-]/gi, '-');
    const path = `blog/${safeSlug}/inline-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('assets').upload(path, file, { cacheControl: '3600', upsert: true });
    if (error) { alert('Upload failed: ' + error.message); return; }
    const { data } = supabase.storage.from('assets').getPublicUrl(path);
    post.inlineImages = post.inlineImages || [];
    post.inlineImages.push(data?.publicUrl);
    await this.save();
    input.value = '';
  }

  insertInlineImg(idx: number, url: string) {
    const post: any = this.draft.blog?.posts?.[idx];
    if (!post) return;
    const snippet = `\n<p><img src="${url}" alt="" /></p>\n`;
    post.contentHtml = (post.contentHtml || '') + snippet;
  }

  /**
   * Given a public URL, extract the storage key after `/object/public/assets/`.
   * Returns null if it cannot parse.
   */
  private _pathFromPublicUrl(url?: string | null): string | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      const marker = '/storage/v1/object/public/assets/';
      const idx = u.pathname.indexOf(marker);
      if (idx === -1) return null;
      const key = u.pathname.substring(idx + marker.length);
      return key || null;
    } catch {
      return null;
    }
  }

  // --- Storage helper -----------------------------------------------------
  /**
   * Attempts to remove a file from the `assets` bucket. If removal fails,
   * returns false so callers can surface a message.
   */
  private async _removeStorageQuiet(path: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.from('assets').remove([path]);
      if (error) {
        console.warn('[storage.remove] failed for', path, error.message);
        return false;
      }
      // If SDK returns an empty array, treat as failure to be explicit
      if (!data || data.length === 0) {
        console.warn('[storage.remove] no data returned for', path);
        return false;
      }
      return true;
    } catch (e) {
      console.warn('[storage.remove] exception for', path, e);
      return false;
    }
  }
}
