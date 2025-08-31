import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

function hideLoader() {
  const el = document.getElementById('app-loader');
  if (el && !el.classList.contains('hidden')) {
    el.classList.add('hidden');
    // remove after fade-out
    setTimeout(() => el.remove(), 400);
  }
}

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
    // App booted successfully
    hideLoader();
    ensureRobotsForDomain();
  })
  .catch((err) => {
    console.error('[bootstrap] failed:', err);
    // Don’t leave users stuck behind the overlay
    hideLoader();
    ensureRobotsForDomain();
  });

// Extra safety: if something blocks early JS, still hide after a few seconds
window.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 3000));
