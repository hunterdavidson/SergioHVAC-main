import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { ViewportScroller } from '@angular/common';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app.routes';
import { SettingsService } from './core/settings.service';
import { provideServiceWorker } from '@angular/service-worker';
import { environment } from '../environments/environment';

function preloadSettings(settings: SettingsService) {
  // Do the minimal work, never block indefinitely
  return async () => {
    try {
      await settings.load();   // do your quick async init
    } catch (e) {
      console.warn('[settings] init failed (continuing):', e);
    }
    // DO NOT await settings.ready() here if that depends on streams/auth, etc.
  };
}

// Configure global scroll offset so fragment navigation accounts for fixed navbar
function configureScrollOffset(scroller: ViewportScroller) {
  return () => {
    try {
      if (typeof window === 'undefined') return;
      scroller.setOffset(() => {
        try {
          const header = document.getElementById('mainNav');
          const h = header?.getBoundingClientRect().height || 0;
          if (h > 0) return [0, Math.ceil(h)] as [number, number];
        } catch {}
        try {
          const css = getComputedStyle(document.documentElement).getPropertyValue('--nav-h');
          const n = parseInt((css || '').replace('px', '').trim(), 10);
          if (!Number.isNaN(n) && n > 0) return [0, n] as [number, number];
        } catch {}
        return [0, 80] as [number, number];
      });
    } catch (e) {
      console.warn('[scroll] setOffset failed (continuing):', e);
    }
  };
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled',
      })
    ),
    { provide: APP_INITIALIZER, useFactory: preloadSettings, deps: [SettingsService], multi: true },
    { provide: APP_INITIALIZER, useFactory: configureScrollOffset, deps: [ViewportScroller], multi: true },
    // Register SW only in the browser
    ...(typeof window !== 'undefined'
      ? [
          provideServiceWorker('ngsw-worker.js', {
            // Extra safety: never register SW on localhost/127.0.0.1 even if env toggled to production.
            enabled: (environment.production && (typeof location === 'undefined' ? true : !/^(localhost|127\.0\.0\.1)$/.test(location.hostname))),
            registrationStrategy: 'registerWhenStable:30000',
          }),
        ]
      : [])
  ],
};
