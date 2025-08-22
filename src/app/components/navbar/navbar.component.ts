import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class NavbarComponent {
  isMenuOpen: boolean = false;

  closeNavbar(): void {
    if (this.isMenuOpen) {
      this.isMenuOpen = false;
    }
  }
  
  toggleNavbar(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }
  
  

  // Optional: Dynamically assign the rotation class for toggler icon
  get togglerIconClass(): string {
    return this.isMenuOpen ? 'rotated' : ''; // Apply 'rotated' when open
  }
}
