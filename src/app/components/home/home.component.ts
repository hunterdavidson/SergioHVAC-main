import { Component, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.component.html'
})
export class HomeComponent {
  constructor(public settings: SettingsService) {
    // ensure settings loaded if app didn't preload it
    effect(() => void 0); // noop; just here if you later add signals
  }

  get heroStyle() {
    const url = this.settings.value.home.heroUrl?.trim();
    return url
      ? { backgroundImage: `url('${url}')`, backgroundSize: 'cover', backgroundPosition: 'center' }
      : {};
  }
}