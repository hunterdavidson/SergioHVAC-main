import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

// ✅ add these:
import { APP_INITIALIZER } from '@angular/core';
import { SettingsService } from './app/core/settings.service';

function initSettings(settings: SettingsService) {
  // Return a function that returns a Promise so Angular waits for it
  return () => settings.load();
}

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withInMemoryScrolling({
        anchorScrolling: 'enabled',
        scrollPositionRestoration: 'enabled'
      })
    ),
    // ✅ Load settings once before the app renders any route
    { provide: APP_INITIALIZER, useFactory: initSettings, deps: [SettingsService], multi: true }
  ]
}).catch(console.error);