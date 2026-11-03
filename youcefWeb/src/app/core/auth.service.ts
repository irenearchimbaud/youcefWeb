import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Utilisateur } from './models';

const CLE = 'youcef-session';

// Comptes de démonstration : à remplacer par un vrai backend (base SQL + API).
export const UTILISATEURS: Utilisateur[] = [
  { id: 'u1', identifiant: 'youcef', motDePasse: 'pro123', nom: 'Youcef', role: 'pro' },
  { id: 'u2', identifiant: 'marie', motDePasse: 'client123', nom: 'Marie Dupont', role: 'client' },
  { id: 'u3', identifiant: 'paul', motDePasse: 'client123', nom: 'Paul Martin', role: 'client' },
];

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly _utilisateur = signal<Utilisateur | null>(this.charger());
  readonly utilisateur = this._utilisateur.asReadonly();
  readonly connecte = computed(() => this._utilisateur() !== null);

  connexion(identifiant: string, motDePasse: string): boolean {
    const trouve = UTILISATEURS.find(
      (u) => u.identifiant === identifiant.trim().toLowerCase() && u.motDePasse === motDePasse,
    );
    if (!trouve) return false;
    this._utilisateur.set(trouve);
    if (this.navigateur) localStorage.setItem(CLE, trouve.id);
    this.router.navigateByUrl(this.espaceDe(trouve));
    return true;
  }

  deconnexion(): void {
    this._utilisateur.set(null);
    if (this.navigateur) localStorage.removeItem(CLE);
    this.router.navigateByUrl('/');
  }

  espaceDe(u: Utilisateur): string {
    return u.role === 'pro' ? '/espace-pro' : '/espace-client';
  }

  private charger(): Utilisateur | null {
    if (!this.navigateur) return null;
    const id = localStorage.getItem(CLE);
    return UTILISATEURS.find((u) => u.id === id) ?? null;
  }
}
