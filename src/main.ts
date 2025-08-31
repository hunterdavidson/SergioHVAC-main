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

bootstrapApplication(AppComponent, appConfig)
  .then(() => {
    // App booted successfully
    hideLoader();
  })
  .catch((err) => {
    console.error('[bootstrap] failed:', err);
    // Don’t leave users stuck behind the overlay
    hideLoader();
  });

// Extra safety: if something blocks early JS, still hide after a few seconds
window.addEventListener('DOMContentLoaded', () => setTimeout(hideLoader, 3000));
