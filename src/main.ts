import { bootstrapApplication } from '@angular/platform-browser';
import { provideRouter, withInMemoryScrolling } from '@angular/router';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { APP_INITIALIZER } from '@angular/core';
import { SettingsService } from './app/core/settings.service';

function preloadSettings(settings: SettingsService) {
  return () => settings.load().then(() => settings.ready());
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
    { provide: APP_INITIALIZER, useFactory: preloadSettings, deps: [SettingsService], multi: true }
  ]
}).catch(console.error);