import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TrPipe } from '../../core/i18n';

const LONGUEUR_MIN = 10;

/** Choix du mot de passe : à la première connexion d'un client (code remplacé) ou après un lien « mot de passe oublié ». */
@Component({
  selector: 'app-nouveau-mot-de-passe',
  imports: [FormsModule, TrPipe],
  template: `
    <div class="conteneur page">
      <section class="carte">
        <span class="sur-titre">{{ 'Espace membre' | tr: 'Member area' }}</span>
        <h1>{{ premiereConnexion() ? ('Bienvenue' | tr: 'Welcome') : ('Nouveau mot de passe' | tr: 'New password') }}</h1>
        <p class="intro">
          @if (premiereConnexion()) {
            {{ "Pour protéger votre espace, choisissez dès maintenant votre propre mot de passe. Le code de première connexion ne fonctionnera plus ensuite, et personne d'autre que vous ne connaîtra votre mot de passe." | tr: 'To protect your space, please choose your own password now. The first-login code will stop working afterwards, and nobody but you will know your password.' }}
          } @else {
            {{ 'Choisissez un nouveau mot de passe pour votre compte.' | tr: 'Choose a new password for your account.' }}
          }
        </p>

        <form (ngSubmit)="valider()">
          <label for="mdp">{{ 'Nouveau mot de passe' | tr: 'New password' }}</label>
          <input id="mdp" name="mdp" type="password" [(ngModel)]="motDePasse" autocomplete="new-password" required />
          <small class="aide">{{ '10 caractères minimum.' | tr: 'At least 10 characters.' }}</small>

          <label for="confirmation">{{ 'Confirmer le mot de passe' | tr: 'Confirm password' }}</label>
          <input id="confirmation" name="confirmation" type="password" [(ngModel)]="confirmation" autocomplete="new-password" required />

          @switch (erreur()) {
            @case ('court') {
              <p class="erreur" role="alert">{{ 'Le mot de passe doit contenir au moins 10 caractères.' | tr: 'The password must be at least 10 characters long.' }}</p>
            }
            @case ('different') {
              <p class="erreur" role="alert">{{ 'Les deux mots de passe ne correspondent pas.' | tr: 'The two passwords do not match.' }}</p>
            }
            @case ('identique') {
              <p class="erreur" role="alert">{{ "Choisissez un mot de passe différent de l'ancien." | tr: 'Choose a password different from the previous one.' }}</p>
            }
            @case ('erreur') {
              <p class="erreur" role="alert">{{ "Le mot de passe n'a pas pu être enregistré. Si le lien a expiré, demandez-en un nouveau." | tr: 'The password could not be saved. If the link has expired, please request a new one.' }}</p>
            }
          }

          <button class="btn large" type="submit" [disabled]="envoi()">
            {{ envoi() ? ('Enregistrement…' | tr: 'Saving…') : ('Enregistrer le mot de passe' | tr: 'Save password') }}
          </button>
        </form>
      </section>
    </div>
  `,
  styles: `
    .page { display: grid; place-items: center; padding: 4rem 0; min-height: calc(100dvh - 4.5rem); }
    .carte { width: 100%; max-width: 460px; }
    h1 { font-size: 2.6rem; margin-bottom: 0.4rem; }
    .intro { color: var(--texte-doux); }
    .aide { color: var(--texte-doux); }
    .btn { margin-top: 1.4rem; }
    .erreur { color: var(--danger); margin: 0.9rem 0 0; font-size: 0.9rem; font-weight: 500; }
  `,
})
export class NouveauMotDePasse {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly premiereConnexion = computed(() => this.auth.utilisateur()?.doitChangerMdp === true);

  protected motDePasse = '';
  protected confirmation = '';
  protected readonly envoi = signal(false);
  protected readonly erreur = signal<'court' | 'different' | 'identique' | 'erreur' | null>(null);

  protected async valider(): Promise<void> {
    if (this.envoi()) return;
    if (this.motDePasse.length < LONGUEUR_MIN) return this.erreur.set('court');
    if (this.motDePasse !== this.confirmation) return this.erreur.set('different');
    this.erreur.set(null);
    this.envoi.set(true);
    try {
      const r = await this.auth.definirMotDePasse(this.motDePasse);
      if (r !== 'ok') return this.erreur.set(r);
      const u = this.auth.utilisateur();
      void this.router.navigateByUrl(u ? this.auth.espaceDe(u) : '/login');
    } catch {
      this.erreur.set('erreur');
    } finally {
      this.envoi.set(false);
    }
  }
}
