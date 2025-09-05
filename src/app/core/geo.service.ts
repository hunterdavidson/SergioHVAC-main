import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformServer } from '@angular/common';
import { TransferState, makeStateKey } from '@angular/core';

type CityCoord = { slug: string; name: string; lat?: number; lon?: number };

const GEO_STATE_KEY = makeStateKey<CityCoord | null>('geo_city');

@Injectable({ providedIn: 'root' })
export class GeoService {
  private platformId = inject(PLATFORM_ID);
  private state = inject(TransferState);
  private nearest = signal<CityCoord | null>(null);

  // Minimal anchor list to map rough location to a friendly city label
  private anchors: CityCoord[] = [
    { slug: 'dallas', name: 'Dallas', lat: 32.7767, lon: -96.7970 },
    { slug: 'fort-worth', name: 'Fort Worth', lat: 32.7555, lon: -97.3308 },
    { slug: 'arlington', name: 'Arlington', lat: 32.7357, lon: -97.1081 },
    { slug: 'plano', name: 'Plano', lat: 33.0198, lon: -96.6989 },
    { slug: 'irving', name: 'Irving', lat: 32.8140, lon: -96.9489 },
    { slug: 'grapevine', name: 'Grapevine', lat: 32.9343, lon: -97.0781 },
    { slug: 'frisco', name: 'Frisco', lat: 33.1507, lon: -96.8236 },
    { slug: 'mckinney', name: 'McKinney', lat: 33.1972, lon: -96.6398 },
    { slug: 'mesquite', name: 'Mesquite', lat: 32.7668, lon: -96.5992 },
    { slug: 'lewisville', name: 'Lewisville', lat: 33.0450, lon: -96.9823 }
  ];

  constructor() {
    // Prefer SSR transfer if present
    const fromState = this.state.get(GEO_STATE_KEY, null);
    if (fromState) {
      this.nearest.set(fromState);
      return;
    }
    // On browser, read Vercel middleware cookies (no permission prompt)
    if (!isPlatformServer(this.platformId) && typeof document !== 'undefined') {
      // Prefer globals set early in index.html; fallback to cookies
      const w: any = typeof window !== 'undefined' ? window : {};
      let cityCookie = (w.__geoCity as string) || this.readCookie('x-geo-city');
      const latStr = String(w.__geoLat ?? '') || this.readCookie('x-geo-lat');
      const lonStr = String(w.__geoLon ?? '') || this.readCookie('x-geo-lon');
      let found: CityCoord | null = null;
      if (cityCookie) {
        const lower = cityCookie.toLowerCase();
        // Normalize common metro codes
        if (lower === 'dfw' || lower === 'dallas fort worth' || lower === 'dallas-fort worth') {
          this.nearest.set({ slug: 'dfw', name: 'Dallas–Fort Worth area' });
          return;
        }
        // Try anchors by name; else fallback to generic label
        found = this.anchors.find(a => a.name.toLowerCase() === lower)
          || { slug: lower.replace(/\s+/g,'-'), name: cityCookie };
      } else if (latStr && lonStr) {
        const lat = Number(latStr), lon = Number(lonStr);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) found = this.findNearest(lat, lon);
      }
      if (found) this.nearest.set(found);
    }
  }

  city() { return this.nearest(); }

  // Back-compat no-op: we no longer prompt the user
  detect(): void { /* no-op: SSR header-based */ }

  private toRad(x: number) { return (x * Math.PI) / 180; }
  private distanceKm(a: { lat: number; lon: number }, b: { lat?: number; lon?: number }) {
    if (b.lat == null || b.lon == null) return Number.POSITIVE_INFINITY;
    const R = 6371; // km
    const dLat = this.toRad(b.lat - a.lat);
    const dLon = this.toRad(b.lon - a.lon);
    const lat1 = this.toRad(a.lat);
    const lat2 = this.toRad(b.lat);
    const sinDLat = Math.sin(dLat / 2);
    const sinDLon = Math.sin(dLon / 2);
    const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon;
    const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
    return R * c;
  }

  private findNearest(lat: number, lon: number): CityCoord | null {
    let best: CityCoord | null = null;
    let bestDist = Number.POSITIVE_INFINITY;
    for (const c of this.anchors) {
      const d = this.distanceKm({ lat, lon }, c);
      if (d < bestDist) { bestDist = d; best = c; }
    }
    return best;
  }

  private readCookie(name: string): string | null {
    try {
      const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\/+^])/g, '\\$1') + '=([^;]*)'));
      return match ? decodeURIComponent(match[1]) : null;
    } catch {
      return null;
    }
  }

  // No settings-based city list anymore
}
