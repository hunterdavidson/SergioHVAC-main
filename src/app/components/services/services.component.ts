import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-services',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './services.component.html',
  styleUrls: ['./services.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ServicesComponent {
  // Keep a reference to the service so updates reflect live
  public settings: SettingsService = inject(SettingsService);
}
