import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

function ensureRobotsForDomain() {
  try {
    const host = location.hostname.toLowerCase();
    const isProd = host === 'svhvac.com' || host === 'www.svhvac.com';
    const meta = document.querySelector('meta[name="robots"]');
    if (!isProd && meta) {
      meta.setAttribute('content', 'noindex,nofollow');
    }
    // Also disable GA tracking outside production
    (window as any)['ga-disable-G-2GNW86D06Y'] = !isProd;
  } catch {}
}

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    ensureRobotsForDomain();
  })
  .catch((err) => {
    console.error('[bootstrap] failed:', err);
    ensureRobotsForDomain();
  });
