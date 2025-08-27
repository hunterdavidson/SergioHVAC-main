import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export type TeamMember = {
  name?: string;
  role?: string;
  icon?: string;            // e.g. "fa-user" (Font Awesome class)
  hidden?: boolean;
  photoPath?: string;       // storage key in bucket
  photoUrl?: string;        // public URL to display
};

export type AboutItem = {
  year?: string;
  title?: string;
  body?: string;
  color?: 'blue' | 'red';
  hidden?: boolean;
  icon?: string;
};

export type SiteSettings = {
  home: {
    headline: string;
    subhead: string;
    ctaText: string;
    heroPath?: string;
    heroUrl?: string;
  };
  services: {
    sectionHeading?: string;
    sectionSubheading?: string;
    ac: { title: string; body: string; cta: string; hidden?: boolean };
    heat: { title: string; body: string; cta: string; hidden?: boolean };
    maintenance: { title: string; body: string; cta: string; hidden?: boolean };
  };
  about: {
    heading?: string;
    subheading?: string;
    items: AboutItem[];
  };
  team: {
    heading?: string;
    subheading?: string;
    members: TeamMember[];
  };
  contact: {
    heading?: string;
    subheading?: string;
    cta?: string;
    phoneLead?: string;
  };
  navbar?: {
    phone?: string; // "(555) 555-5555"
  };
};

const DEFAULT_SETTINGS: SiteSettings = {
  home: {
    headline: 'Need HVAC Service Today? We’re Just a Click Away',
    subhead: 'Reliable, Fast, and Local — Book Your Appointment in Minutes',
    ctaText: 'Schedule Your Free Quote',
    heroPath: undefined,
    heroUrl: undefined,
  },
  services: {
    sectionHeading: 'Our Services',
    sectionSubheading: 'Cooling, heating, and maintenance—done right',
    ac: {
      title: 'Fast & Efficient AC Installations',
      body: 'Keep cool with pro installs sized for your home and budget.',
      cta: 'Get Free AC Quote',
      hidden: false,
    },
    heat: {
      title: 'Stay Warm: Trusted Heating Services',
      body: 'Repairs and installs to keep your family comfortable all winter.',
      cta: 'Book Heating Service',
      hidden: false,
    },
    maintenance: {
      title: 'Book Your Seasonal Maintenance',
      body: 'Prevent breakdowns and lower bills with a quick tune-up.',
      cta: 'Schedule Maintenance',
      hidden: false,
    },
  },
  about: {
    heading: 'About Us',
    subheading: 'A quick timeline of our story.',
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
  /** Preload readiness */
  private _loaded = false;
  private _loadedPromise: Promise<void>;
  private _resolveLoaded: (() => void) | null = null;

  constructor() {
    this._loadedPromise = new Promise<void>((resolve) => {
      this._resolveLoaded = resolve;
    });
  }

  /** Current settings snapshot used by app components */
  private _current: SiteSettings = structuredClone(DEFAULT_SETTINGS);

  /** Load settings from DB (site_settings.data JSONB). If missing, seed defaults. */
  async load(): Promise<void> {
    const { data, error } = await supabase
      .from('site_settings')
      .select('data')
      .limit(1)
      .maybeSingle();

    if (error) {
      console.warn('[settings] load failed, falling back to defaults:', error.message);
      const local = this._loadLocal();
      this._current = local ?? structuredClone(DEFAULT_SETTINGS);
      this._markLoaded();
      return;
    }

    if (data?.data) {
      this._current = this._mergeWithDefaults(data.data as SiteSettings);
      this._saveLocal(this._current);
      this._markLoaded();
      return;
    }

    // No row yet — seed one with defaults
    const seeded = this._mergeWithDefaults(DEFAULT_SETTINGS);
    const { error: upsertErr } = await supabase.from('site_settings').insert({ data: seeded });
    if (upsertErr) console.warn('[settings] seed insert failed:', upsertErr.message);
    this._current = seeded;
    this._saveLocal(seeded);
    this._markLoaded();
  }

  /** Save to DB and mirror to localStorage */
  async save(next: SiteSettings): Promise<void> {
    const payload = this._mergeWithDefaults(next);
    const { error } = await supabase
      .from('site_settings')
      .upsert({ data: payload }, { onConflict: 'id' }); // assumes a unique row
    if (error) throw new Error(error.message || 'Failed to save settings');
    this._current = payload;
    this._saveLocal(payload);
  }

  /** Read-only snapshot for components */
  get value(): SiteSettings {
    return this._current;
  }

  /** True once settings have finished loading (or defaulted). */
  get loaded(): boolean {
    return this._loaded;
  }

  /** Promise that resolves when settings are ready. Useful for APP_INITIALIZER. */
  ready(): Promise<void> {
    return this._loadedPromise;
  }

  private _markLoaded(): void {
    if (!this._loaded) {
      this._loaded = true;
      this._resolveLoaded?.();
      this._resolveLoaded = null;
    }
  }

  // -------- helpers --------

  private _mergeWithDefaults(input: Partial<SiteSettings> | undefined): SiteSettings {
    const base = structuredClone(DEFAULT_SETTINGS);

    const out: SiteSettings = {
      ...base,
      ...input,
      home: { ...base.home, ...(input?.home ?? {}) },
      services: {
        ...base.services,
        ...(input?.services ?? {}),
        sectionHeading: input?.services?.sectionHeading ?? base.services.sectionHeading,
        sectionSubheading: input?.services?.sectionSubheading ?? base.services.sectionSubheading,
        ac: { ...base.services.ac, ...(input?.services?.ac ?? {}) },
        heat: { ...base.services.heat, ...(input?.services?.heat ?? {}) },
        maintenance: { ...base.services.maintenance, ...(input?.services?.maintenance ?? {}) },
      },
      about: {
        ...base.about,
        heading: input?.about?.heading ?? base.about.heading,
        subheading: input?.about?.subheading ?? base.about.subheading,
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

    // Ensure structures exist
    out.about.items ??= [];
    out.team.members ??= [];
    out.navbar ??= { phone: '(XXX) XXX-XXXX' };
    out.services.sectionHeading ??= base.services.sectionHeading;
    out.services.sectionSubheading ??= base.services.sectionSubheading;
    out.services.ac.hidden ??= false;
    out.services.heat.hidden ??= false;
    out.services.maintenance.hidden ??= false;

    return out;
  }

  private _loadLocal(): SiteSettings | null {
    try {
      const raw = localStorage.getItem('site_settings');
      return raw ? (JSON.parse(raw) as SiteSettings) : null;
    } catch {
      return null;
    }
  }

  private _saveLocal(s: SiteSettings): void {
    try {
      localStorage.setItem('site_settings', JSON.stringify(s));
    } catch {
      /* ignore */
    }
  }
}