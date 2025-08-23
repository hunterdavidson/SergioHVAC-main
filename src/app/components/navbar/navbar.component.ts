import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router'; // 👈 add these

@Component({
  selector: 'app-navbar',
  standalone: true,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  imports: [CommonModule, RouterLink], // 👈 include here
})
export class NavbarComponent {
  isMenuOpen = false;

  toggleNavbar(): void { this.isMenuOpen = !this.isMenuOpen; }
  closeNavbar(): void { if (this.isMenuOpen) this.isMenuOpen = false; }

  get togglerIconClass(): string { return this.isMenuOpen ? 'rotated' : ''; }
}