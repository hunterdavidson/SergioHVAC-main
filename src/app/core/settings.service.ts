import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export type SiteSettings = {
  home: {
    headline: string;
    subhead: string;
    ctaText: string;
    heroUrl?: string;           // optional hero background image
  };
  services: {
    ac: { title: string; body: string; cta: string };
    heat: { title: string; body: string; cta: string };
    maintenance: { title: string; body: string; cta: string };
  };
  about: {
    items: Array<{
      year?: string;
      title?: string;
      body?: string;
      color?: 'blue' | 'red';
      icon?: string;            // fa- class (shown in About)
      hidden?: boolean;         // toggle visibility
    }>;
  };
  team: {
    heading?: string;
    subheading?: string;
    members: Array<{
      name?: string;
      role?: string;
      icon?: string;            // fallback icon
      photoUrl?: string;        // optional photo (Team only)
      hidden?: boolean;         // toggle visibility
    }>;
  };
  contact: {
    heading?: string;
    subheading?: string;
    cta?: string;
    phoneLead?: string;
  };
  navbar?: {
    phone?: string; // e.g. "(555) 555-5555"
  };
};

const DEFAULT_SETTINGS: SiteSettings = {
  home: {
    headline: 'Need HVAC Service Today? We’re Just a Click Away',
    subhead: 'Reliable, Fast, and Local — Book Your Appointment in Minutes',
    ctaText: 'Schedule Your Free Quote',
    heroUrl: '',
  },
  services: {
    ac: {
      title: 'Fast & Efficient AC Installations',
      body: 'Keep cool with pro installs sized for your home and budget.',
      cta: 'Get Free AC Quote',
    },
    heat: {
      title: 'Stay Warm: Trusted Heating Services',
      body: 'Repairs and installs to keep your family comfortable all winter.',
      cta: 'Book Heating Service',
    },
    maintenance: {
      title: 'Book Your Seasonal Maintenance',
      body: 'Prevent breakdowns and lower bills with a quick tune-up.',
      cta: 'Schedule Maintenance',
    },
  },
  about: {
    items: [{}, {}, {}],
  },
  team: {
    heading: 'Meet the Team',
    subheading: 'Our experienced professionals are here for you.',
    members: [{}, {}, {}],
  },
  contact: {
    heading: 'Request Service',
    subheading: 'Tell us what you need and we’ll get right back to you.',
    cta: 'Request Service Now',
    phoneLead: 'Prefer to talk?',
  },
  navbar: {
    phone: '(XXX) XXX-XXXX',
  },
};

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private _current: SiteSettings = structuredClone(DEFAULT_SETTINGS);

  get value(): SiteSettings {
    return this._current;
  }

  async load(): Promise<void> {
    try {
      const { data, error } = await supabase
        .from('site_settings')
        .select('data')
        .limit(1)
        .maybeSingle();
      if (error) throw error;

      if (data?.data) {
        this._current = this._mergeWithDefaults(data.data as SiteSettings);
        this._saveLocal(this._current);
        return;
      }

      // seed row if missing
      const seeded = this._mergeWithDefaults(DEFAULT_SETTINGS);
      const { error: insertErr } = await supabase
        .from('site_settings')
        .insert({ data: seeded });
      if (insertErr) console.warn('[settings] seed insert failed:', insertErr.message);
      this._current = seeded;
      this._saveLocal(seeded);
    } catch (e) {
      console.warn('[settings] load failed, fallback to local/defaults:', (e as any)?.message);
      const local = this._loadLocal();
      this._current = local ?? structuredClone(DEFAULT_SETTINGS);
    }
  }

  async save(next: SiteSettings): Promise<void> {
    const payload = this._mergeWithDefaults(next);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ data: payload }, { onConflict: 'id' });
    if (error) throw new Error(error.message || 'Failed to save settings');
    this._current = payload;
    this._saveLocal(payload);
  }

  // ---------- helpers ----------
  private _mergeWithDefaults(input: Partial<SiteSettings> | undefined): SiteSettings {
    const base = structuredClone(DEFAULT_SETTINGS);
    return {
      ...base,
      ...input,
      home: { ...base.home, ...(input?.home ?? {}) },
      services: {
        ...base.services,
        ...(input?.services ?? {}),
        ac: { ...base.services.ac, ...(input?.services?.ac ?? {}) },
        heat: { ...base.services.heat, ...(input?.services?.heat ?? {}) },
        maintenance: { ...base.services.maintenance, ...(input?.services?.maintenance ?? {}) },
      },
      about: {
        ...base.about,
        items: input?.about?.items?.length ? input.about.items : base.about.items,
      },
      team: {
        ...base.team,
        heading: input?.team?.heading ?? base.team.heading,
        subheading: input?.team?.subheading ?? base.team.subheading,
        members: input?.team?.members?.length ? input.team.members : base.team.members,
      },
      contact: { ...base.contact, ...(input?.contact ?? {}) },
      navbar: { ...base.navbar, ...(input?.navbar ?? {}) },
    };
  }

  private _loadLocal(): SiteSettings | null {
    try {
      const raw = localStorage.getItem('site_settings');
      return raw ? (JSON.parse(raw) as SiteSettings) : null;
    } catch { return null; }
  }

  private _saveLocal(s: SiteSettings): void {
    try {
      localStorage.setItem('site_settings', JSON.stringify(s));
    } catch { /* ignore */ }
  }
}