import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
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
