import { Routes } from '@angular/router';
import { HomePageComponent } from './components/home-page/home-page.component';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: '', component: HomePageComponent, pathMatch: 'full' },
  // Service detail pages
  {
    path: 'services/ac',
    loadComponent: () => import('./components/service-detail/service-detail.component').then(m => m.ServiceDetailComponent),
    data: { serviceKey: 'ac' }
  },
  {
    path: 'services/heating',
    loadComponent: () => import('./components/service-detail/service-detail.component').then(m => m.ServiceDetailComponent),
    data: { serviceKey: 'heat' }
  },
  {
    path: 'services/maintenance',
    loadComponent: () => import('./components/service-detail/service-detail.component').then(m => m.ServiceDetailComponent),
    data: { serviceKey: 'maintenance' }
  },
  {
    path: 'estimate',
    loadComponent: () => import('./estimate/estimate-calculator.component').then(m => m.EstimateCalculatorComponent),
    canActivate: [authGuard]
  },
  { path: 'education', loadComponent: () => import('./components/education/education.component').then(m => m.EducationComponent) },
  { path: 'education/:slug', loadComponent: () => import('./components/education/education.component').then(m => m.EducationComponent) },
  { path: 'blog', loadComponent: () => import('./components/blog/blog-list.component').then(m => m.BlogListComponent) },
  { path: 'blog/:slug', loadComponent: () => import('./components/blog/blog-post.component').then(m => m.BlogPostComponent) },
  { path: 'maintenance-plan', loadComponent: () => import('./components/plans/plans.component').then(m => m.PlansComponent) },
  // If you have separate pages you can add routes for them; if not, the homepage anchors are fine.

  { path: 'login', loadComponent: () => import('./components/login/login.component').then(m => m.LoginComponent) },

  // Admin area (requires session)
  { path: 'admin', loadComponent: () => import('./components/admin/admin.component').then(m => m.AdminComponent), canActivate: [authGuard] },
  { path: 'admin/customize', loadComponent: () => import('./components/customize/customize.component').then(m => m.CustomizeComponent), canActivate: [authGuard] },

  // 404 fallback (avoid soft-404s by not redirecting everything to home)
  { path: '**', loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent) },
];
