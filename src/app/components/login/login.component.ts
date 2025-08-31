import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { SeoService } from '../../core/seo.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  email = '';
  password = '';
  loading = false;
  error = '';

  private seo = inject(SeoService);
  constructor(private auth: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.seo.setTitle('Admin Login — SV HVAC');
    this.seo.setRobots('noindex,nofollow');
  }

  ngOnDestroy(): void {
    // revert to default crawl for other routes
    this.seo.setRobots('index,follow,max-image-preview:large');
  }

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
