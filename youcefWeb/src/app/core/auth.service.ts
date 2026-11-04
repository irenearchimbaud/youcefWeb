import { Injectable, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { Utilisateur } from './models';

export type ResultatConnexion = 'ok' | 'identifiants' | 'bloque' | 'erreur';
export type ResultatMotDePasse = 'ok' | 'court' | 'identique' | 'lien' | 'ancien' | 'erreur';

/**
 * Authentification par le serveur du site (src/serveur) : les mots de passe sont hachés côté serveur, la session est un
 * cookie HttpOnly que le JavaScript de la page ne peut pas lire. Personne ne peut relire un mot de passe.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  private readonly profil = signal<Utilisateur | null>(null);
  readonly utilisateur = this.profil.asReadonly();
  readonly connecte = computed(() => this.profil() !== null);

  /** Résolu quand la session éventuelle a été lue : à attendre avant de décider d'une redirection. */
  readonly pret: Promise<void> = this.navigateur ? this.rafraichirProfil() : Promise.resolve();

  async connexion(email: string, motDePasse: string): Promise<ResultatConnexion> {
    const r = await this.envoyer({ action: 'connexion', email, motDePasse });
    if (r.status === 401) return 'identifiants';
    if (r.status === 429) return 'bloque';
    if (!r.ok) return 'erreur';
    const u = this.recevoir(await r.json());
    if (!u) return 'erreur';
    void this.router.navigateByUrl(u.doitChangerMdp ? '/nouveau-mot-de-passe' : this.espaceDe(u));
    return 'ok';
  }

  async deconnexion(): Promise<void> {
    await this.envoyer({ action: 'deconnexion' }).catch(() => undefined);
    this.profil.set(null);
    void this.router.navigateByUrl('/');
  }

  /** Demande l'envoi du lien de réinitialisation. La réponse est la même que l'adresse existe ou non. */
  async motDePasseOublie(email: string): Promise<boolean> {
    return (await this.envoyer({ action: 'oubli', email })).ok;
  }

  /**
   * Choisit un nouveau mot de passe : après un lien « mot de passe oublié » (jeton) ou à la première connexion / en étant
   * connecté (ancien mot de passe demandé seulement hors première connexion).
   */
  async definirMotDePasse(motDePasse: string, jeton?: string): Promise<ResultatMotDePasse> {
    const r = await this.envoyer(jeton ? { action: 'reinit', jeton, motDePasse } : { action: 'changer', motDePasse });
    if (r.ok) {
      this.recevoir(await r.json());
      return 'ok';
    }
    const code = (await r.json().catch(() => ({}))).erreur;
    return ['court', 'identique', 'lien', 'ancien'].includes(code) ? code : 'erreur';
  }

  /** Appel d'une route du serveur ; le cookie de session part tout seul. */
  appelerApi(chemin: string, init: RequestInit = {}): Promise<Response> {
    const headers = new Headers(init.headers);
    if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');
    return fetch(chemin, { ...init, headers });
  }

  async rafraichirProfil(): Promise<void> {
    try {
      const r = await fetch('/api/auth');
      this.profil.set(r.ok ? ((await r.json()).utilisateur ?? null) : null);
    } catch {
      this.profil.set(null);
    }
  }

  espaceDe(u: Utilisateur): string {
    return u.role === 'pro' ? '/espace-pro' : '/espace-client';
  }

  private envoyer(corps: Record<string, unknown>): Promise<Response> {
    return this.appelerApi('/api/auth', { method: 'POST', body: JSON.stringify(corps) });
  }

  private recevoir(corps: { utilisateur?: Utilisateur | null }): Utilisateur | null {
    this.profil.set(corps.utilisateur ?? null);
    return this.profil();
  }
}
