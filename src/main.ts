import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';
import { environment } from './environments/environment';

if (environment.production) {
  window.addEventListener('unhandledrejection', (e) => {
    const msg = String(e.reason || '');
    if (msg.includes('NavigatorLockAcquireTimeoutError') ||
        msg.includes('LockManager lock "lock:sb-')) {
      e.preventDefault();
    }
  }, true);
}

bootstrapApplication(AppComponent, appConfig).catch(console.error);
