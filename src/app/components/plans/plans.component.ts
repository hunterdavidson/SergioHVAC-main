import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-plans',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './plans.component.html',
  styleUrls: ['./plans.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlansComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);
  private router = inject(Router);

  private readonly accentClasses = ['plan-card--cool', 'plan-card--heat', 'plan-card--cool'];
  private readonly ctaClasses = ['plan-card__cta--cool', 'plan-card__cta--heat', 'plan-card__cta--cool'];
  private readonly perksFallback = [
    'Precision seasonal tune-ups',
    'Priority scheduling all year',
    'Member-only repair discounts'
  ];

  constructor() {
    const heading = this.settings.value.plans?.heading || 'Maintenance Plans';
    const description = this.settings.value.plans?.subheading || 'Prevent breakdowns and keep comfort steady all year';
    this.seo.setTitle(`${heading} | SV HVAC`);
    this.seo.setCanonical('/maintenance-plan');
    if (description) {
      this.seo.setDescription(description);
    }
  }

  get hasPlans(): boolean {
    return (this.settings.value.plans?.tiers || []).length > 0;
  }

  trackByIdx(index: number): number {
    return index;
  }

  planAccent(index: number): string {
    return this.accentClasses[index % this.accentClasses.length];
  }

  planCtaClass(index: number): string {
    return this.ctaClasses[index % this.ctaClasses.length];
  }

  get sharedPerks(): string[] {
    const tiers = this.settings.value.plans?.tiers || [];
    const perks: string[] = [];
    const seen = new Set<string>();

    for (const tier of tiers) {
      const features = tier?.features || [];
      for (const raw of features) {
        const text = (raw || '').trim();
        if (!text) continue;
        const key = text.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        perks.push(text);
        if (perks.length >= 4) {
          break;
        }
      }
      if (perks.length >= 4) {
        break;
      }
    }

    return perks.length ? perks : this.perksFallback;
  }

  get displayPhone(): string {
    return this.settings.value.navbar?.phone || '(817) 724-5507';
  }

  get telHref(): string {
    const digits = this.displayPhone.replace(/[^0-9]/g, '');
    return digits ? `tel:${digits}` : 'tel:';
  }

  async selectPlan(tier: { name?: string } | null | undefined): Promise<void> {
    const planName = this.normalizePlanName(tier?.name) || undefined;

    try {
      await this.router.navigate(['/contact'], {
        queryParams: planName ? { plan: planName } : {},
      });
    } catch {
      // navigation failures are non-blocking for the interaction
    }
  }

  private normalizePlanName(raw: string | null | undefined): string | null {
    if (!raw) return null;
    const target = raw.trim();
    if (!target) return null;
    const tiers = this.settings.value.plans?.tiers || [];
    const match = tiers.find(t => (t?.name || '').toLowerCase() === target.toLowerCase());
    return match?.name || target;
  }
}
