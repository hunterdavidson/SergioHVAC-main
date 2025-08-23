import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { SettingsService } from '../../core/settings.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [CommonModule, RouterLink],
})
export class NavbarComponent {
  isMenuOpen = false;
  isAdminNav = false;

  // make settings available to the template
  public settings = inject(SettingsService);
  private router = inject(Router);

  ngOnInit() {
    this.isAdminNav = this.router.url.startsWith('/admin');
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.isAdminNav = event.urlAfterRedirects.startsWith('/admin');
      }
    });
  }

  toggleNavbar(): void { this.isMenuOpen = !this.isMenuOpen; }
  closeNavbar(): void { if (this.isMenuOpen) this.isMenuOpen = false; }

  get togglerIconClass(): string { return this.isMenuOpen ? 'rotated' : ''; }

  // === Safe values for the call button ===
  get displayPhone(): string {
    return this.settings.value.navbar?.phone || '(XXX) XXX-XXXX';
  }
  get telHref(): string {
    const raw = this.displayPhone;
    const digitsOnly = raw.replace(/[^0-9]/g, ''); // ok in TS
    return `tel:${digitsOnly}`;
  }
}