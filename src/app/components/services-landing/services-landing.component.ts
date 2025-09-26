import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { SeoService } from '../../core/seo.service';
import { SettingsService } from '../../core/settings.service';
import { ServicesComponent } from "../services/services.component";

@Component({
  selector: 'app-services-landing',
  standalone: true,
  imports: [CommonModule, ServicesComponent],
  templateUrl: './services-landing.component.html',
  styleUrls: ['./services-landing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServicesLandingComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);

  constructor() {
    const heading = this.settings.value.services.sectionHeading || 'Our Services';
    this.seo.setTitle(`${heading} | SV HVAC Services`);
    this.seo.setCanonical('/services');
    const desc = this.settings.value.services.sectionSubheading;
    if (desc) this.seo.setDescription(desc);
  }

  get serviceCards() {
    const services = this.settings.value.services;
    return [

      { key: 'ac', accent: 'ac', route: '/services/ac', ...services.ac },

      { key: 'heat', accent: 'heat', route: '/services/heating', ...services.heat },

      { key: 'maintenance', accent: 'maint', route: '/services/maintenance', ...services.maintenance },

    ].filter(card => !card.hidden);

  }

  cardAccent(key: string): string {
    switch (key) {
      case 'heat':
        return 'service-box--heat';
      case 'maintenance':
        return 'service-box--maint';
      default:
        return 'service-box--ac';
    }
  }


}
