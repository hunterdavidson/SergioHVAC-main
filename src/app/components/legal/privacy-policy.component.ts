import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './privacy-policy.component.html',
  styleUrls: ['./privacy-policy.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrivacyPolicyComponent {
  private settings = inject(SettingsService);
  private sanitizer = inject(DomSanitizer);
  private seo = inject(SeoService);

  constructor() {
    const title = this.policy?.title || 'Privacy Policy';
    this.seo.setTitle(`${title} | SV HVAC Services`);
    this.seo.setCanonical('/privacy-policy');
    if (this.policy?.updatedOn) {
      this.seo.setDescription(`${title} updated ${this.policy.updatedOn}.`);
    }
  }

  get policy() {
    return this.settings.value.legal?.privacy;
  }

  get content(): SafeHtml {
    const html = this.policy?.contentHtml || '<p>Our privacy policy will be published soon.</p>';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
