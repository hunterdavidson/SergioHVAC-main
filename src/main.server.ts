// Proper SSR bootstrap that returns an ApplicationRef for the prerenderer.
import { bootstrapApplication } from '@angular/platform-browser';
import { provideServerRendering } from '@angular/platform-server';

import { AppComponent } from './app/app.component';
import { appConfig } from './app/app.config';

export default function bootstrap() {
  const serverAppConfig: typeof appConfig = {
    ...appConfig,
    providers: [
      ...(appConfig.providers || []),
      provideServerRendering(),
    ],
  };

  return bootstrapApplication(AppComponent, serverAppConfig);
}
