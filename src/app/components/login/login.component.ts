import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  async submit() {
    this.error = '';
    if (!this.email || !this.password || this.loading) return;
    this.loading = true;
    try {
      await this.auth.signIn(this.email.trim(), this.password);
      this.router.navigateByUrl('/admin');
    } catch (e: any) {
      this.error = e?.message || 'Login failed';
    } finally {
      this.loading = false;
    }
  }
}