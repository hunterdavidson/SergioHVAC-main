// src/app/core/auth.guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = async (): Promise<boolean | UrlTree> => {
  const auth = inject(AuthService);
  const router = inject(Router);

  // Ensure the one-time init finished (idempotent)
  await auth.waitUntilReady();

  const ok = auth.isAdmin(); // purely cached read
  return ok ? true : router.createUrlTree(['/login']);
};
