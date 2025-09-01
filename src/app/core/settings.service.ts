import { Injectable } from '@angular/core';
import { supabase } from './supabase.client';

export type TeamMember = {
  name?: string;
  role?: string;
  icon?: string;            // e.g. 'user' | 'wrench' | 'snowflake' | 'fire' | 'star'
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

export type GalleryItem = { path?: string; url?: string; alt?: string };

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
  servicePages?: {
    ac: {
      heading?: string;
      subheading?: string;
      body?: string;
      heroPath?: string;
      heroUrl?: string;
      features: string[];
      gallery: GalleryItem[];
    };
    heat: {
      heading?: string;
      subheading?: string;
      body?: string;
      heroPath?: string;
      heroUrl?: string;
      features: string[];
      gallery: GalleryItem[];
    };
    maintenance: {
      heading?: string;
      subheading?: string;
      body?: string;
      heroPath?: string;
      heroUrl?: string;
      features: string[];
      gallery: GalleryItem[];
    };
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
  estimate?: {
    targetMargin?: number; // 0.40 = 40%
    taxRate?: number; // 0.0825
    laborTaxResidential?: boolean;
    laborTaxCommercial?: boolean;
    overheadPct?: number; // 0.12
    seasonalMultipliers?: { normal: number; summer: number };
    accessMultipliers?: { easy: number; standard: number; difficult: number };
    afterHoursMultiplier?: number; // 1.25
    permitFlat?: number; // 175
    addOnPrices?: {
      lineSet?: number;
      condenserPad?: number;
      whipDisconnect?: number;
      electricalUpgrade?: number;
      smartThermostat?: { label: string; price: number };
      basicThermostat?: { label: string; price: number };
      craneFee?: number;
      disposalFee?: number;
      refrigerant?: { R410A?: number; R22?: number };
    };
    perJob?: {
      perWorkerPerJobLow: number;
      perWorkerPerJobHigh: number;
      defaultCrewSize: number;
      altCrewSize?: number;
    };
    perHour?: { hourlyRatePerTech: number; defaultCrewSize: number };
    baselineHours?: {
      acSplitChangeout: { min: number; max: number };
      furnaceReplace: { min: number; max: number };
      heatPumpReplace: { min: number; max: number };
      miniSplitSingle: { min: number; max: number };
      miniSplitExtraHead: { min: number; max: number };
      electricalUpgrade: number;
      lineSetReplace: number;
    };
    equipmentBasePrices?: any;
    ductworkAddersHours?: { none: number; minor: number; moderate: number; major: number };
    goodBetterBest?: boolean;
    showFinancing?: boolean;
    zipPrefixes?: { [prefix: string]: number }; // e.g., { '760':1.00, '761':1.02, '750':1.03 }
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
  servicePages: {
    ac: {
      heading: 'Air Conditioning Installation & Repair',
      subheading: 'High‑efficiency cooling, sized and installed right',
      body: 'From fast repairs to new high‑efficiency installs, we keep your home cool and your bills low. We size systems properly and stand behind our work.',
      features: [
        'Same‑day diagnostics',
        'Licensed, insured technicians',
        'Honest pricing, no surprises',
        'Manufacturer‑backed warranties'
      ],
      gallery: [{}, {}, {}],
    },
    heat: {
      heading: 'Heating Services & Furnace Replacement',
      subheading: 'Safe, reliable heat when you need it most',
      body: 'We repair and replace furnaces and heat pumps with careful attention to safety and efficiency so you stay comfortable all season.',
      features: [
        'Emergency repairs',
        'Clean workmanship',
        'Energy‑saving options',
        'Transparent recommendations'
      ],
      gallery: [{}, {}, {}],
    },
    maintenance: {
      heading: 'Seasonal Maintenance & Tune‑Ups',
      subheading: 'Prevent breakdowns and lower your bills',
      body: 'A quick seasonal tune‑up can extend system life, improve comfort, and help prevent inconvenient breakdowns during peak weather.',
      features: [
        'Multi‑point inspection',
        'Filter replacement',
        'Refrigerant and electrical checks',
        'Friendly tips to keep air clean'
      ],
      gallery: [{}, {}, {}],
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
  estimate: {
    targetMargin: 0.40,
    taxRate: 0.0825,
    laborTaxResidential: false,
    laborTaxCommercial: true,
    overheadPct: 0.12,
    seasonalMultipliers: { normal: 1.0, summer: 1.10 },
    accessMultipliers: { easy: 0.95, standard: 1.00, difficult: 1.15 },
    afterHoursMultiplier: 1.25,
    permitFlat: 175,
    addOnPrices: {
      lineSet: 380,
      condenserPad: 120,
      whipDisconnect: 95,
      electricalUpgrade: 350,
      smartThermostat: { label: 'Smart (Ecobee3 Lite)', price: 250 },
      basicThermostat: { label: 'Basic (Honeywell T4)', price: 85 },
      craneFee: 550,
      disposalFee: 95,
      refrigerant: { R410A: 65, R22: 120 },
    },
    perJob: {
      perWorkerPerJobLow: 300,
      perWorkerPerJobHigh: 400,
      defaultCrewSize: 3,
      
    },
    perHour: { hourlyRatePerTech: 95, defaultCrewSize: 3 },
    baselineHours: {
      acSplitChangeout: { min: 4, max: 8 },
      furnaceReplace: { min: 4, max: 8 },
      heatPumpReplace: { min: 6, max: 9 },
      miniSplitSingle: { min: 4, max: 6 },
      miniSplitExtraHead: { min: 4, max: 6 },
      electricalUpgrade: 2,
      lineSetReplace: 2,
    },
    equipmentBasePrices: undefined,
    ductworkAddersHours: { none: 0, minor: 6, moderate: 12, major: 20 },
    goodBetterBest: true,
    showFinancing: false,
    zipPrefixes: { '760': 1.00, '761': 1.02, '750': 1.03 },
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
      servicePages: {
        ac: {
          ...(base.servicePages?.ac ?? {}),
          ...(input?.servicePages?.ac ?? {}),
          features: input?.servicePages?.ac?.features?.length ? input.servicePages!.ac!.features : (base.servicePages?.ac?.features ?? []),
          gallery: input?.servicePages?.ac?.gallery?.length ? input.servicePages!.ac!.gallery : (base.servicePages?.ac?.gallery ?? []),
        },
        heat: {
          ...(base.servicePages?.heat ?? {}),
          ...(input?.servicePages?.heat ?? {}),
          features: input?.servicePages?.heat?.features?.length ? input.servicePages!.heat!.features : (base.servicePages?.heat?.features ?? []),
          gallery: input?.servicePages?.heat?.gallery?.length ? input.servicePages!.heat!.gallery : (base.servicePages?.heat?.gallery ?? []),
        },
        maintenance: {
          ...(base.servicePages?.maintenance ?? {}),
          ...(input?.servicePages?.maintenance ?? {}),
          features: input?.servicePages?.maintenance?.features?.length ? input.servicePages!.maintenance!.features : (base.servicePages?.maintenance?.features ?? []),
          gallery: input?.servicePages?.maintenance?.gallery?.length ? input.servicePages!.maintenance!.gallery : (base.servicePages?.maintenance?.gallery ?? []),
        },
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
      estimate: {
        ...base.estimate,
        ...(input?.estimate ?? {}),
        addOnPrices: {
          ...(base.estimate?.addOnPrices ?? {}),
          ...(input?.estimate?.addOnPrices ?? {}),
          refrigerant: {
            ...(base.estimate?.addOnPrices?.refrigerant ?? {}),
            ...(input?.estimate?.addOnPrices?.refrigerant ?? {}),
          },
          smartThermostat: {
            ...(base.estimate?.addOnPrices?.smartThermostat ?? {}),
            ...(input?.estimate?.addOnPrices?.smartThermostat ?? {}),
          },
          basicThermostat: {
            ...(base.estimate?.addOnPrices?.basicThermostat ?? {}),
            ...(input?.estimate?.addOnPrices?.basicThermostat ?? {}),
          },
        } as any,
        seasonalMultipliers: {
          ...(base.estimate?.seasonalMultipliers ?? { normal: 1, summer: 1.1 }),
          ...(input?.estimate?.seasonalMultipliers ?? {}),
        },
        accessMultipliers: {
          ...(base.estimate?.accessMultipliers ?? { easy: 0.95, standard: 1, difficult: 1.15 }),
          ...(input?.estimate?.accessMultipliers ?? {}),
        },
        perJob: {
          ...(base.estimate?.perJob ?? { perWorkerPerJobLow:300, perWorkerPerJobHigh:400, defaultCrewSize:3, altCrewSize:4 }),
          ...(input?.estimate?.perJob ?? {}),
        },
        perHour: {
          ...(base.estimate?.perHour ?? { hourlyRatePerTech: 95, defaultCrewSize: 3 }),
          ...(input?.estimate?.perHour ?? {}),
        },
        baselineHours: {
          ...(base.estimate?.baselineHours ?? {}),
          ...(input?.estimate?.baselineHours ?? {}),
        } as any,
        equipmentBasePrices: (input?.estimate?.equipmentBasePrices ?? base.estimate?.equipmentBasePrices),
        ductworkAddersHours: {
          ...(base.estimate?.ductworkAddersHours ?? { none:0, minor:6, moderate:12, major:20 }),
          ...(input?.estimate?.ductworkAddersHours ?? {}),
        },
        zipPrefixes: {
          ...(base.estimate?.zipPrefixes ?? {}),
          ...(input?.estimate?.zipPrefixes ?? {}),
        },
      },
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
    out.estimate ??= structuredClone(base.estimate!);

    // Ensure servicePages arrays exist with 3 gallery slots
    out.servicePages ??= structuredClone(base.servicePages!);
    for (const key of ['ac','heat','maintenance'] as const) {
      const page: any = (out.servicePages as any)[key] || {};
      page.features ||= [];
      page.gallery ||= [];
      while (page.gallery.length < 3) page.gallery.push({});
      (out.servicePages as any)[key] = page;
    }

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
