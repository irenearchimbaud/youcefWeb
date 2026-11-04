import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Utilisateur } from './models';
import { Supabase } from './supabase';

export type ResultatConnexion = 'ok' | 'identifiants' | 'erreur';

/** Authentification par Supabase Auth : les mots de passe sont hachés et gérés par Supabase, jamais visibles par personne. */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly router = inject(Router);
  private readonly supabase = inject(Supabase);

  private readonly profil = signal<Utilisateur | null>(null);
  readonly utilisateur = this.profil.asReadonly();
  readonly connecte = computed(() => this.profil() !== null);
  /** Vrai quand la personne arrive depuis un lien « mot de passe oublié ». */
  readonly recuperation = signal(false);

  /** Résolu quand la session éventuelle a été lue : à attendre avant de décider d'une redirection. */
  readonly pret: Promise<void>;

  constructor() {
    const sb = this.supabase.client;
    if (!sb) {
      this.pret = Promise.resolve();
      return;
    }
    sb.auth.onAuthStateChange((evenement, session) => {
      if (evenement === 'PASSWORD_RECOVERY') this.recuperation.set(true);
      // Pas d'appel Supabase directement dans ce rappel (risque de blocage) : on le décale.
      setTimeout(() => {
        if (!session) this.profil.set(null);
        else if (evenement !== 'INITIAL_SESSION') void this.chargerProfil(session.user.id);
      });
    });
    this.pret = sb.auth
      .getSession()
      .then(({ data }) => (data.session ? this.chargerProfil(data.session.user.id) : undefined))
      .catch(() => undefined);
  }

  async connexion(email: string, motDePasse: string): Promise<ResultatConnexion> {
    const { data, error } = await this.supabase.db.auth.signInWithPassword({ email: email.trim().toLowerCase(), password: motDePasse });
    if (error || !data.user) return error?.status === 400 || error?.status === 401 ? 'identifiants' : 'erreur';
    await this.chargerProfil(data.user.id);
    const u = this.profil();
    if (!u) return 'erreur';
    this.router.navigateByUrl(u.doitChangerMdp ? '/nouveau-mot-de-passe' : this.espaceDe(u));
    return 'ok';
  }

  async deconnexion(): Promise<void> {
    await this.supabase.db.auth.signOut();
    this.profil.set(null);
    this.recuperation.set(false);
    this.router.navigateByUrl('/');
  }

  /** Envoie le lien de réinitialisation. Ne révèle jamais si l'adresse existe. */
  async motDePasseOublie(email: string): Promise<boolean> {
    const { error } = await this.supabase.db.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: `${location.origin}/nouveau-mot-de-passe`,
    });
    return !error || error.status === 400 || error.status === 422;
  }

  /** Définit le nouveau mot de passe (première connexion ou réinitialisation) puis lève l'obligation de le changer. */
  async definirMotDePasse(nouveau: string): Promise<'ok' | 'identique' | 'erreur'> {
    const sb = this.supabase.db;
    const { error } = await sb.auth.updateUser({ password: nouveau });
    if (error) return /different|same/i.test(error.message) ? 'identique' : 'erreur';
    await sb.rpc('mot_de_passe_change');
    this.recuperation.set(false);
    // Mise à jour locale (et non rechargement) : un rechargement lancé par l'événement USER_UPDATED pourrait renvoyer l'ancienne valeur.
    this.profil.update((p) => (p ? { ...p, doitChangerMdp: false } : p));
    return 'ok';
  }

  /** Jeton de session à envoyer aux fonctions serveur (api/*). */
  async jeton(): Promise<string | null> {
    const sb = this.supabase.client;
    if (!sb) return null;
    return (await sb.auth.getSession()).data.session?.access_token ?? null;
  }

  async appelerApi(chemin: string, init: RequestInit = {}): Promise<Response> {
    const jeton = await this.jeton();
    const headers = new Headers(init.headers);
    if (jeton) headers.set('Authorization', `Bearer ${jeton}`);
    if (init.body) headers.set('Content-Type', 'application/json');
    return fetch(chemin, { ...init, headers });
  }

  async rafraichirProfil(): Promise<void> {
    const u = this.profil();
    if (u) await this.chargerProfil(u.id);
  }

  espaceDe(u: Utilisateur): string {
    return u.role === 'pro' ? '/espace-pro' : '/espace-client';
  }

  private async chargerProfil(id: string): Promise<void> {
    const { data } = await this.supabase.db.from('profiles').select('id, nom, email, role, solde, doit_changer_mdp').eq('id', id).maybeSingle();
    this.profil.set(
      data ? { id: data.id, nom: data.nom, email: data.email, role: data.role, solde: data.solde, doitChangerMdp: data.doit_changer_mdp } : null,
    );
  }
}
