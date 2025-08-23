import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const adminGuard: CanActivateFn = async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
  
    const session = await auth.getSession();
    if (!session) { router.navigateByUrl('/login'); return false; }
  
    const role = (session.user.app_metadata as Record<string, unknown>)?.['role'];
    if (role !== 'admin') { router.navigateByUrl('/login'); return false; }
  
    return true;
  };
  
