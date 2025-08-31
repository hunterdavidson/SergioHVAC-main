import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { SettingsService, SiteSettings, TeamMember } from '../../core/settings.service';
import { supabase } from '../../core/supabase.client';

@Component({
  selector: 'app-customize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customize.component.html',
  styleUrls: ['./customize.component.scss'],
})
export class CustomizeComponent implements OnInit {
  private settingsSvc = inject(SettingsService);

  loading = true;
  error = '';
  saving = false;
  saveError = '';
  saveOk = false;

  // The editable copy
  draft!: SiteSettings;

  // --- Lifecycle -----------------------------------------------------------
  async ngOnInit() {
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
      while (p.gallery.length < 3) p.gallery.push({});
      (this.draft.servicePages as any)[k] = p;
    }
  }

  // --- Save ---------------------------------------------------------------
  async save() {
    this.saving = true;
    this.saveError = '';

    try {
      // tiny sanitization
      if (this.draft.navbar?.phone) this.draft.navbar.phone = this.draft.navbar.phone.trim();

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
