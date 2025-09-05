import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';
import { ContactComponent } from '../contact/contact.component';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule, RouterLink, ContactComponent],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);

  constructor() {
    const h = this.settings.value.plans?.heading || 'Maintenance Plans';
    const d = this.settings.value.plans?.subheading || 'Prevent breakdowns and keep comfort steady all year';
    this.seo.setTitle(`${h} — SV HVAC`);
    this.seo.setCanonical('/maintenance-plan');
    if (d) this.seo.setDescription(d);
  }
}
