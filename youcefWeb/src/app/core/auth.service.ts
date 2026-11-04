import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Utilisateur } from './models';
import { DataService } from './data.service';

const CLE = 'youcef-session';

// Authentification de démonstration côté navigateur : à remplacer par un vrai backend (base SQL + API).
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly data = inject(DataService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly session = signal<string | null>(this.charger());

  /** Toujours à jour : un client supprimé ou dont le solde change est reflété immédiatement. */
  readonly utilisateur = computed(() => this.data.utilisateurs().find((u) => u.id === this.session()) ?? null);
  readonly connecte = computed(() => this.utilisateur() !== null);

  connexion(identifiant: string, code: string): boolean {
    const trouve = this.data
      .utilisateurs()
      .find((u) => u.identifiant === identifiant.trim().toLowerCase() && u.code.toUpperCase() === code.trim().toUpperCase());
    if (!trouve) return false;
    this.session.set(trouve.id);
    if (this.navigateur) localStorage.setItem(CLE, trouve.id);
    this.router.navigateByUrl(this.espaceDe(trouve));
    return true;
  }

  deconnexion(): void {
    this.session.set(null);
    if (this.navigateur) localStorage.removeItem(CLE);
    this.router.navigateByUrl('/');
  }

  espaceDe(u: Utilisateur): string {
    return u.role === 'pro' ? '/espace-pro' : '/espace-client';
  }

  private charger(): string | null {
    return this.navigateur ? localStorage.getItem(CLE) : null;
  }
}
