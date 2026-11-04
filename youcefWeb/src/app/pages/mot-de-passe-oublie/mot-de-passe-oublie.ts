import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { TrPipe } from '../../core/i18n';

@Component({
  selector: 'app-mot-de-passe-oublie',
  imports: [FormsModule, RouterLink, TrPipe],
  template: `
    <div class="conteneur page">
      <section class="carte">
        <span class="sur-titre">{{ 'Espace membre' | tr: 'Member area' }}</span>
        <h1>{{ 'Mot de passe oublié' | tr: 'Forgot your password' }}</h1>

        @if (envoye()) {
          <p class="succes" role="status">
            {{ "Si un compte existe avec cette adresse, un e-mail vient d'être envoyé avec un lien pour choisir un nouveau mot de passe. Pensez à vérifier vos courriers indésirables." | tr: 'If an account exists for this address, an email with a link to choose a new password has just been sent. Please also check your spam folder.' }}
          </p>
        } @else {
          <p class="intro">{{ "Indiquez l'adresse e-mail de votre compte : vous recevrez un lien pour choisir un nouveau mot de passe." | tr: 'Enter the email address of your account: you will receive a link to choose a new password.' }}</p>
          <form (ngSubmit)="envoyer()">
            <label for="email">{{ 'E-mail' | tr: 'Email' }}</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" autocomplete="email" required />
            @if (erreur()) {
              <p class="erreur" role="alert">{{ "L'envoi n'a pas pu être effectué. Réessayez dans un instant." | tr: 'The email could not be sent. Please try again in a moment.' }}</p>
            }
            <button class="btn large" type="submit" [disabled]="envoi() || !email.trim()">
              {{ envoi() ? ('Envoi…' | tr: 'Sending…') : ('Envoyer le lien' | tr: 'Send the link') }}
            </button>
          </form>
        }

        <a routerLink="/login" class="retour">{{ '← Retour à la connexion' | tr: '← Back to sign in' }}</a>
      </section>
    </div>
  `,
  styles: `
    .page { display: grid; place-items: center; padding: 4rem 0; min-height: calc(100dvh - 4.5rem); }
    .carte { width: 100%; max-width: 460px; }
    h1 { font-size: 2.6rem; margin-bottom: 0.4rem; }
    .intro { color: var(--texte-doux); }
    .btn { margin-top: 1.4rem; }
    .erreur { color: var(--danger); margin: 0.9rem 0 0; font-size: 0.9rem; font-weight: 500; }
    .succes { color: var(--succes); font-weight: 500; }
    .retour { display: inline-block; margin-top: 1.6rem; font-size: 0.88rem; color: var(--texte-doux); text-decoration: none; &:hover { color: var(--bleu-profond); } }
  `,
})
export class MotDePasseOublie {
  private readonly auth = inject(AuthService);

  protected email = '';
  protected readonly envoi = signal(false);
  protected readonly envoye = signal(false);
  protected readonly erreur = signal(false);

  protected async envoyer(): Promise<void> {
    if (this.envoi() || !this.email.trim()) return;
    this.envoi.set(true);
    this.erreur.set(false);
    try {
      (await this.auth.motDePasseOublie(this.email)) ? this.envoye.set(true) : this.erreur.set(true);
    } catch {
      this.erreur.set(true);
    } finally {
      this.envoi.set(false);
    }
  }
}
