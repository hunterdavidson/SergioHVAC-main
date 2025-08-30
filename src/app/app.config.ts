// src/app/app.config.ts
import { ApplicationConfig, APP_INITIALIZER, provideZoneChangeDetection } from '@angular/core';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';

import { routes } from './app.routes';
import { SettingsService } from './core/settings.service';

function preloadSettings(settings: SettingsService) {
  // Ensure settings are loaded before app starts
  return () => settings.load().then(() => settings.ready());
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
    provideClientHydration(withEventReplay()),
    { provide: APP_INITIALIZER, useFactory: preloadSettings, deps: [SettingsService], multi: true },
  ],
};
