import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './models';
import { AuthService } from './auth.service';

export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.utilisateur();
  if (!u) return router.createUrlTree(['/login']);
  if (u.role !== role) return router.createUrlTree([auth.espaceDe(u)]);
  return true;
};
