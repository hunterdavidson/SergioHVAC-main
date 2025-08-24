import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [CommonModule, RouterLink],
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isAdminNav = false;

  // make settings available to the template
  public settings: SettingsService = inject(SettingsService);
  private router: Router = inject(Router);
  private sub?: Subscription;

  ngOnInit(): void {
    // Ensure settings are loaded at app start
    this.settings.load();
    this.isAdminNav = this.router.url.startsWith('/admin');
    this.sub = this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationEnd) {
        this.isAdminNav = event.urlAfterRedirects.startsWith('/admin');
      }
    });
  }

  ngOnDestroy(): void {
    if (this.sub) {
      this.sub.unsubscribe();
    }
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
    const digitsOnly = raw.replace(/[^0-9]/g, '');
    return `tel:${digitsOnly}`;
  }
}