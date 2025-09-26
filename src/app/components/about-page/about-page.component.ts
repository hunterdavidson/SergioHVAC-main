import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { AboutComponent } from '../about/about.component';
import { SeoService } from '../../core/seo.service';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [CommonModule, AboutComponent],
  templateUrl: './about-page.component.html',
  styleUrls: ['./about-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutPageComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);

  constructor() {
    const heading = this.settings.value.about?.heading || 'About Us';
    this.seo.setTitle(`${heading} | SV HVAC Services`);
    this.seo.setCanonical('/about');
    if (this.settings.value.about?.subheading) {
      this.seo.setDescription(this.settings.value.about?.subheading!);
    }
  }
}
