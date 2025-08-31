import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

type IconName = 'user' | 'star' | 'wrench' | 'snowflake' | 'fire' | 'phone' | 'email';

@Component({
  selector: 'app-icon',
  standalone: true,
  template: `
    <svg [attr.width]="size" [attr.height]="size" viewBox="0 0 24 24" [attr.fill]="color" aria-hidden="true">
      <path [attr.d]="pathD" />
    </svg>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IconComponent {
  @Input() name: IconName | string = 'user';
  @Input() size = 24;
  @Input() color = 'currentColor';

  private paths: Record<string, string> = {
    user: 'M12 12a5 5 0 100-10 5 5 0 000 10zm-7 9a7 7 0 0114 0v1H5v-1z',
    star: 'M12 17.27l6.18 3.73-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
    wrench: 'M21.7 6.3l-4 4-4-4 1.4-1.4 1.6 1.6 2.6-2.6a4 4 0 11-2.6 6.9L9 15v3l-4 4-2-2 4-4h3l4.6-4.6a4 4 0 106.1-5.7z',
    snowflake: 'M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2zm0 8l.9 2.7L15.6 14l-2.7.9L12 17.6l-.9-2.7L8.4 14l2.7-.9L12 10z',
    fire: 'M13.5 2.1a1 1 0 011.5.86c0 1.76.6 3.22 1.8 4.38C18.8 8.32 20 10.2 20 12.5A7.5 7.5 0 015 12.5c0-2.16 1.08-4.09 3.25-5.8.57 2.36 1.74 3.55 3.5 3.55 1.22 0 2.21-.5 2.95-1.5.35 2.17-.56 3.73-2.72 4.7-.86.39-1.5 1.07-1.78 1.96a4 4 0 107.8-1.38c0-1.7-.9-3.23-2.7-4.6-1.25-.97-2.05-2.13-2.35-3.53z',
    phone: 'M6.62 10.79a15.05 15.05 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V21a1 1 0 01-1 1C10.85 22 2 13.15 2 2a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z',
    email: 'M20 4H4a2 2 0 00-2 2v12a2 2 0 002 2h16a2 2 0 002-2V6a2 2 0 00-2-2zm0 4l-8 5L4 8V6l8 5 8-5v2z',
  };

  get pathD(): string {
    const key = (this.name || 'user').toString();
    return this.paths[key] ?? this.paths['user'];
  }
}
