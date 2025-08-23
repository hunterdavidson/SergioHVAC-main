import { CommonModule } from '@angular/common';
import { Component, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService, SiteSettings } from '../../core/settings.service';

@Component({
  selector: 'app-customize',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customize.component.html',
  styleUrls: ['./customize.component.scss'],
})
export class CustomizeComponent implements OnInit {
  // UI state used by the template
  loading = true;
  error = '';
  saving = false;
  saved = false;
  saveError = '';

  // local editable copy (do NOT mutate SettingsService.value directly)
  private draft = signal<SiteSettings | null>(null);

  constructor(private settings: SettingsService) {}

  async ngOnInit(): Promise<void> {
    try {
      // Load from DB/localStorage via the service
      await this.settings.load();
      // Deep clone so edits don’t mutate the live snapshot
      this.draft.set(this.deepClone(this.settings.value));
    } catch (e: any) {
      this.error = e?.message || 'Failed to load settings';
    } finally {
      this.loading = false;
    }
  }

  /** Expose model() so the template can use `model() as m` safely */
  model(): SiteSettings {
    const v = this.draft();
    if (!v) throw new Error('settings not ready');
    return v;
  }

  /** Ensure we always render exactly 3 About items in the editor */
  ensureAboutItems() {
    const m = this.model();
    if (!Array.isArray(m.about.items)) m.about.items = [];
    while (m.about.items.length < 3) m.about.items.push({});
    if (m.about.items.length > 3) m.about.items.length = 3;
    return m.about.items;
  }

  /** Ensure we always render exactly 3 Team members in the editor */
  ensureTeamMembers() {
    const m = this.model();
    if (!Array.isArray(m.team.members)) m.team.members = [];
    while (m.team.members.length < 3) m.team.members.push({});
    if (m.team.members.length > 3) m.team.members.length = 3;
    return m.team.members;
  }

  /** Local hero image preview → set URL field (storage upload can set real URL later) */
  onHeroSelected(evt: Event) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    this.model().home.heroUrl = url;
  }

  /** Local team photo preview per index */
  onTeamPhotoSelected(evt: Event, idx: number) {
    const input = evt.target as HTMLInputElement;
    const file = input?.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    const members = this.ensureTeamMembers();
    if (members[idx]) members[idx].photoUrl = url;
  }

  canSave(): boolean {
    return !!this.draft() && !this.loading;
  }

  async save(): Promise<void> {
    if (!this.canSave()) return;
    this.saving = true;
    this.saved = false;
    this.saveError = '';

    try {
      // Normalize arrays to remove trailing empty objects the user didn’t fill
      const payload = this.normalizeBeforeSave(this.deepClone(this.model()));
      await this.settings.save(payload);
      this.saved = true;
      // refresh our draft from the service snapshot
      this.draft.set(this.deepClone(this.settings.value));
      setTimeout(() => (this.saved = false), 1500);
    } catch (e: any) {
      this.saveError = e?.message || 'Failed to save changes';
    } finally {
      this.saving = false;
    }
  }

  // ---------- helpers ----------

  private deepClone<T>(obj: T): T {
    // structuredClone when available; fallback to JSON
    try {
      // @ts-ignore
      if (typeof structuredClone === 'function') return structuredClone(obj);
    } catch {}
    return JSON.parse(JSON.stringify(obj)) as T;
  }

  private isEmptyVal(v: unknown): boolean {
    return v === undefined || v === null || (typeof v === 'string' && v.trim() === '');
  }

  private normalizeBeforeSave(s: SiteSettings): SiteSettings {
    // Trim strings and drop fully empty items/members
    s.home.headline = s.home.headline?.trim();
    s.home.subhead = s.home.subhead?.trim();
    s.home.ctaText = s.home.ctaText?.trim();
    s.home.heroUrl = s.home.heroUrl?.trim();

    s.navbar = s.navbar || {};
    if (s.navbar.phone) s.navbar.phone = s.navbar.phone.trim();

    const cleanAbout = (s.about.items || [])
      .map(it => ({
        ...it,
        year: it.year?.trim(),
        title: it.title?.trim(),
        body: it.body?.trim(),
        icon: it.icon?.trim(),
      }))
      .filter(it =>
        !this.isEmptyVal(it.year) ||
        !this.isEmptyVal(it.title) ||
        !this.isEmptyVal(it.body) ||
        !this.isEmptyVal(it.icon) ||
        !!it.hidden ||
        !!it.color
      );
    s.about.items = cleanAbout;

    const cleanMembers = (s.team.members || [])
      .map(m => ({
        ...m,
        name: m.name?.trim(),
        role: m.role?.trim(),
        icon: m.icon?.trim(),
        photoUrl: m.photoUrl?.trim(),
      }))
      .filter(m =>
        !this.isEmptyVal(m.name) ||
        !this.isEmptyVal(m.role) ||
        !this.isEmptyVal(m.icon) ||
        !this.isEmptyVal(m.photoUrl) ||
        !!m.hidden
      );
    s.team.members = cleanMembers;

    s.team.heading = s.team.heading?.trim();
    s.team.subheading = s.team.subheading?.trim();

    s.contact.heading = s.contact.heading?.trim();
    s.contact.subheading = s.contact.subheading?.trim();
    s.contact.cta = s.contact.cta?.trim();
    s.contact.phoneLead = s.contact.phoneLead?.trim();

    return s;
  }
}