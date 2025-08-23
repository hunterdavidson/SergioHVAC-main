import { Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page.component';
import { AdminComponent } from './components/admin/admin.component';
import { CustomizeComponent } from './components/customize/customize.component';
import { LoginComponent } from './components/login/login.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  // If you have separate pages you can add routes for them; if not, the homepage anchors are fine.

  { path: 'login', component: LoginComponent },

  // Admin area (requires session)
  { path: 'admin', component: AdminComponent, canActivate: [authGuard] },
  { path: 'admin/customize', component: CustomizeComponent, canActivate: [authGuard] },

  // Fallback
  { path: '**', redirectTo: '' },
];