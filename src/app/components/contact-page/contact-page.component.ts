import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { ContactComponent } from '../contact/contact.component';
import { SeoService } from '../../core/seo.service';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-contact-page',
  standalone: true,
  imports: [CommonModule, ContactComponent],
  templateUrl: './contact-page.component.html',
  styleUrls: ['./contact-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactPageComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);

  constructor() {
    this.seo.setTitle('Contact Us | SV HVAC Services');
    this.seo.setCanonical('/contact');
    this.seo.setDescription('Request HVAC service, schedule a tune-up, or ask a question.');
  }
  get phoneHref(): string | null {
    const phone = this.settings.value.navbar?.phone;
    if (!phone) return null;
    const digits = phone.replace(/[^0-9]/g, '');
    return digits ? `tel:${digits}` : null;
  }

}
