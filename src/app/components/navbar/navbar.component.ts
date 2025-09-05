import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router, RouterLink, NavigationEnd, Event as RouterEvent } from '@angular/router';
import { SettingsService } from '../../core/settings.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [CommonModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavbarComponent implements OnInit, OnDestroy {
  isMenuOpen = false;
  isAdminNav = false;

  // make settings available to the template
  public settings: SettingsService = inject(SettingsService);
  private router: Router = inject(Router);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private sub?: Subscription;

  ngOnInit(): void {
    const currentUrl = (this.router.url as any)?.toString?.() ?? String(this.router.url || '');
    this.isAdminNav = this._isAdminUrl(currentUrl);
    this.cdr.markForCheck();
    this.sub = this.router.events.subscribe((event: RouterEvent) => {
      if (event instanceof NavigationEnd) {
        const nextUrl = (event.urlAfterRedirects as any)?.toString?.() ?? String(event.urlAfterRedirects || '');
        this.isAdminNav = this._isAdminUrl(nextUrl);
        this.cdr.markForCheck();
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

  private _isAdminUrl(url: string): boolean {
    return url.startsWith('/admin') || url.startsWith('/estimate');
  }

  // Scroll to on-page contact form; do not redirect to home
  goToContact(evt: Event) {
    try {
      const el = document.getElementById('contact');
      if (el) {
        evt.preventDefault();
        if (this.isMenuOpen) this.isMenuOpen = false;
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    } catch {}
    // No contact section on this page; keep user on current route
    // Let the native anchor update the fragment without redirecting
    if (this.isMenuOpen) this.isMenuOpen = false;
  }
}
