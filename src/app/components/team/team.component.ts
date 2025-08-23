import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-team',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team.component.html'
})
export class TeamComponent {
  constructor(public settings: SettingsService) {}

  get visibleMembers() {
    return (this.settings.value.team.members || []).filter(m => !m?.hidden);
  }

  iconClass(icon?: string) {
    return icon?.trim() || 'fa-solid fa-user';
  }
}