import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Role } from './models';
import { AuthService } from './auth.service';

/** Réserve une page à un rôle. Un client qui n'a pas encore choisi son mot de passe est d'abord envoyé le définir. */
export const roleGuard = (role: Role): CanActivateFn => async () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  await auth.pret;
  const u = auth.utilisateur();
  if (!u) return router.createUrlTree(['/login']);
  if (u.doitChangerMdp) return router.createUrlTree(['/nouveau-mot-de-passe']);
  if (u.role !== role) return router.createUrlTree([auth.espaceDe(u)]);
  return true;
};

/** Page de choix du mot de passe : réservée aux personnes connectées (première connexion ou lien « mot de passe oublié »). */
export const sessionGuard: CanActivateFn = async () => {
  const auth = inject(AuthService);
  await auth.pret;
  return auth.utilisateur() ? true : inject(Router).createUrlTree(['/login']);
};
