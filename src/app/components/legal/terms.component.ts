import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { SeoService } from '../../core/seo.service';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-terms',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms.component.html',
  styleUrls: ['./terms.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TermsComponent {
  private settings = inject(SettingsService);
  private sanitizer = inject(DomSanitizer);
  private seo = inject(SeoService);

  constructor() {
    const title = this.terms?.title || 'Terms & Conditions';
    this.seo.setTitle(`${title} | SV HVAC Services`);
    this.seo.setCanonical('/terms-of-service');
    if (this.terms?.updatedOn) {
      this.seo.setDescription(`${title} updated ${this.terms.updatedOn}.`);
    }
  }

  get terms() {
    return this.settings.value.legal?.terms;
  }

  get content(): SafeHtml {
    const html = this.terms?.contentHtml || '<p>Our terms and conditions will be published soon.</p>';
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
