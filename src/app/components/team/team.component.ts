import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';
import { SettingsService, TeamMember } from '../../core/settings.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './team.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TeamComponent {
  constructor(public settings: SettingsService) {}

  get visibleMembers(): TeamMember[] {
    return (this.settings.value.team?.members || []).filter(
      (member): member is TeamMember => !!member && !member.hidden
    );
  }

  trackByIdx(index: number): number {
    return index;
  }
}
