import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { NavbarComponent } from './components/navbar/navbar.component';
import { SettingsService } from './core/settings.service';
import { AuthService } from './core/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, NavbarComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  constructor(
    public settings: SettingsService,
    private auth: AuthService
  ) {}

  async ngOnInit() {
    // One-time, idempotent auth bootstrap to avoid parallel lock attempts
    await this.auth.init();
  }
}
