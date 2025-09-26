import { CommonModule } from '@angular/common';
import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { TeamComponent } from '../team/team.component';
import { SeoService } from '../../core/seo.service';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-team-page',
  standalone: true,
  imports: [CommonModule, TeamComponent],
  templateUrl: './team-page.component.html',
  styleUrls: ['./team-page.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TeamPageComponent {
  settings = inject(SettingsService);
  private seo = inject(SeoService);

  constructor() {
    const heading = this.settings.value.team?.heading || 'Meet the Team';
    this.seo.setTitle(`${heading} | SV HVAC Services`);
    this.seo.setCanonical('/team');
    if (this.settings.value.team?.subheading) {
      this.seo.setDescription(this.settings.value.team?.subheading!);
    }
  }
}
