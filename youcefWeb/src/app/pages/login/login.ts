import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <aside class="panneau" aria-hidden="true">
        <span class="logo"></span>
        <blockquote>« Se retrouver, c'est déjà commencer à avancer. »</blockquote>
        <p>Votre espace personnel : vos documents, vos demandes de rendez-vous, en toute confidentialité.</p>
      </aside>

      <section class="formulaire">
        <form (ngSubmit)="valider()">
          <span class="sur-titre">Espace membre</span>
          <h1>Bon retour</h1>
          <p class="intro">Connectez-vous pour accéder à votre espace.</p>

          <label for="id">Identifiant</label>
          <input id="id" name="id" [(ngModel)]="identifiant" autocomplete="username" required />

          <label for="pwd">Mot de passe</label>
          <input id="pwd" name="pwd" type="password" [(ngModel)]="motDePasse" autocomplete="current-password" required />

          @if (erreur()) {
            <p class="erreur" role="alert">Identifiant ou mot de passe incorrect.</p>
          }

          <button class="btn large" type="submit">Se connecter</button>

          <div class="demo">
            <span>Comptes de démonstration</span>
            <button type="button" (click)="remplir('marie', 'client123')">Espace client</button>
            <button type="button" (click)="remplir('youcef', 'pro123')">Espace Youcef</button>
          </div>

          <a routerLink="/" class="retour">← Retour à l'accueil</a>
        </form>
      </section>
    </div>
  `,
  styles: `
    .page {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: calc(100dvh - 4.5rem);
    }
    .panneau {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 1.6rem;
      padding: 3rem;
      text-align: center;
      color: var(--ivoire-clair);
      background:
        radial-gradient(500px 400px at 50% 20%, rgba(108, 174, 214, 0.3), transparent 70%),
        linear-gradient(160deg, var(--bleu-profond), var(--bleu-nuit));
    }
    .panneau .logo { width: 150px; box-shadow: 0 0 0 8px rgba(255, 255, 255, 0.1), 0 0 0 9px var(--champagne); }
    blockquote {
      margin: 0;
      max-width: 22rem;
      font-family: var(--serif);
      font-size: 2.2rem;
      font-style: italic;
      line-height: 1.2;
    }
    .panneau p { max-width: 22rem; margin: 0; opacity: 0.7; font-size: 0.95rem; }

    .formulaire { display: grid; place-items: center; padding: 3rem 1.5rem; }
    form { width: 100%; max-width: 400px; }
    h1 { font-size: 3rem; margin-bottom: 0.3rem; }
    .intro { color: var(--texte-doux); }
    .btn { margin-top: 1.6rem; }
    .erreur { color: var(--danger); margin: 0.9rem 0 0; font-size: 0.9rem; font-weight: 500; }

    .demo {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
      margin-top: 1.8rem;
      padding-top: 1.4rem;
      border-top: 1px solid var(--champagne);
      font-size: 0.8rem;
      color: var(--texte-doux);

      span { width: 100%; }
      button {
        padding: 0.35rem 0.9rem;
        border: 1px solid var(--champagne);
        border-radius: 999px;
        background: var(--blanc);
        font: 500 0.82rem var(--sans);
        color: var(--bleu-profond);
        cursor: pointer;
        transition: background 0.2s, border-color 0.2s;
        &:hover { background: var(--bleu-diamant); border-color: var(--bleu-clair); }
      }
    }
    .retour { display: inline-block; margin-top: 1.8rem; font-size: 0.88rem; color: var(--texte-doux); text-decoration: none; &:hover { color: var(--bleu-profond); } }

    @media (max-width: 800px) {
      .page { grid-template-columns: 1fr; }
      .panneau { display: none; }
    }
  `,
})
export class Login {
  private readonly auth = inject(AuthService);

  protected identifiant = '';
  protected motDePasse = '';
  protected readonly erreur = signal(false);

  protected remplir(identifiant: string, motDePasse: string): void {
    this.identifiant = identifiant;
    this.motDePasse = motDePasse;
    this.erreur.set(false);
  }

  protected valider(): void {
    this.erreur.set(!this.auth.connexion(this.identifiant, this.motDePasse));
  }
}
