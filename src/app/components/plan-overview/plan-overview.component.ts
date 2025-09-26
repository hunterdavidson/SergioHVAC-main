import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-plan-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './plan-overview.component.html',
  styleUrls: ['./plan-overview.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PlanOverviewComponent {
  private settingsSvc = inject(SettingsService);
  private readonly accentClasses = ['plan-card--cool', 'plan-card--heat', 'plan-card--maint'];
  private readonly ctaClasses = ['plan-card__cta-button--cool', 'plan-card__cta-button--heat', 'plan-card__cta-button--maint'];

  get heading(): string {
    return this.settingsSvc.value.plans?.heading || 'Maintenance Plans';
  }

  get subheading(): string {
    return this.settingsSvc.value.plans?.subheading || 'Keep breakdowns at bay with tune-ups tailored to your home.';
  }

  get tiers() {
    const tiers = this.settingsSvc.value.plans?.tiers || [];
    return tiers.slice(0, 3).map((tier) => ({
      ...tier,
      features: (tier.features || []).slice(0, 3),
    }));
  }

  planAccent(index: number): string {
    return this.accentClasses[index % this.accentClasses.length];
  }

  planCtaClass(index: number): string {
    return this.ctaClasses[index % this.ctaClasses.length];
  }
}
