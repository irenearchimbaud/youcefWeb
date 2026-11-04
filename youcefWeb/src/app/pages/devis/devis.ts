import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18n, TrPipe } from '../../core/i18n';

@Component({
  selector: 'app-devis',
  imports: [FormsModule, RouterLink, TrPipe],
  template: `
    <div class="page">
      <section class="formulaire">
        @if (envoye()) {
          <div class="succes">
            <span class="sur-titre">{{ 'Demande envoyée' | tr: 'Request sent' }}</span>
            <h1>{{ 'Merci !' | tr: 'Thank you!' }}</h1>
            <p class="intro">
              {{
                'Youcef a bien reçu votre demande. Il vous répond par e-mail dans les meilleurs délais, puis crée votre espace personnel.'
                  | tr: 'Youcef has received your request. He will reply by email as soon as possible and then set up your personal space.'
              }}
            </p>
            <a routerLink="/" class="btn">{{ "Retour à l'accueil" | tr: 'Back to home' }}</a>
          </div>
        } @else {
          <form (ngSubmit)="envoyer()">
            <span class="sur-titre">{{ 'Demande de devis' | tr: 'Quote request' }}</span>
            <h1>{{ 'Parlons de votre projet' | tr: 'Let’s talk about your project' }}</h1>
            <p class="intro">{{ 'Quelques informations suffisent : Youcef vous répond personnellement par e-mail.' | tr: 'A few details are enough: Youcef will reply to you personally by email.' }}</p>

            <label for="nom">{{ 'Nom et prénom' | tr: 'Full name' }}</label>
            <input id="nom" name="nom" [(ngModel)]="nom" autocomplete="name" maxlength="100" required />

            <label for="email">{{ 'E-mail' | tr: 'Email' }}</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" autocomplete="email" maxlength="150" required />

            <label for="tel">{{ 'Téléphone (facultatif)' | tr: 'Phone (optional)' }}</label>
            <input id="tel" name="tel" type="tel" [(ngModel)]="telephone" autocomplete="tel" maxlength="30" />

            <label for="formule">{{ 'Formule souhaitée' | tr: 'Preferred package' }}</label>
            <select id="formule" name="formule" [(ngModel)]="formule">
              <option value="">{{ 'Je ne sais pas encore' | tr: 'I’m not sure yet' }}</option>
              @for (f of formules; track f.fr) {
                <option [value]="f.fr">{{ f.fr | tr: f.en }}</option>
              }
            </select>

            <label for="message">{{ 'Ce qui vous amène' | tr: 'What brings you here' }}</label>
            <textarea id="message" name="message" rows="5" [(ngModel)]="message" maxlength="3000" required></textarea>

            <input class="piege" name="siteWeb" [(ngModel)]="siteWeb" tabindex="-1" autocomplete="off" aria-hidden="true" />

            @if (erreur()) {
              <p class="erreur" role="alert">{{ erreur() }}</p>
            }

            <button class="btn large" type="submit" [disabled]="enCours()">
              {{ enCours() ? ('Envoi…' | tr: 'Sending…') : ('Envoyer ma demande' | tr: 'Send my request') }}
            </button>
            <a routerLink="/" class="retour">{{ "← Retour à l'accueil" | tr: '← Back to home' }}</a>
          </form>
        }
      </section>
    </div>
  `,
  styles: `
    .page { display: grid; place-items: center; padding: 3rem 1.5rem; min-height: calc(100dvh - 4.5rem); }
    .formulaire { width: 100%; max-width: 520px; }
    h1 { font-size: 2.8rem; margin-bottom: 0.3rem; }
    .intro { color: var(--texte-doux); }
    input, select, textarea {
      display: block; width: 100%; box-sizing: border-box; margin-top: 0.3rem;
      padding: 0.7rem 0.9rem; border: 1px solid var(--champagne); border-radius: 10px;
      background: var(--blanc); font: 1rem var(--sans); color: inherit;
    }
    label { display: block; margin-top: 1.1rem; font-weight: 500; font-size: 0.9rem; }
    textarea { resize: vertical; }
    .piege { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
    .btn { margin-top: 1.6rem; }
    .erreur { color: var(--danger); margin: 0.9rem 0 0; font-size: 0.9rem; font-weight: 500; }
    .retour { display: inline-block; margin-top: 1.8rem; margin-left: 1rem; font-size: 0.88rem; color: var(--texte-doux); text-decoration: none; &:hover { color: var(--bleu-profond); } }
  `,
})
export class Devis {
  private readonly i18n = inject(I18n);

  protected readonly formules = [
    { fr: 'Accompagnement ciblé', en: 'Focused coaching' },
    { fr: 'Accompagnement approfondi', en: 'In-depth coaching' },
    { fr: "Bootcamp à l'étranger", en: 'Bootcamp abroad' },
  ];

  protected nom = '';
  protected email = '';
  protected telephone = '';
  protected formule = inject(ActivatedRoute).snapshot.queryParamMap.get('formule') ?? '';
  protected message = '';
  protected siteWeb = '';

  protected readonly enCours = signal(false);
  protected readonly envoye = signal(false);
  protected readonly erreur = signal('');

  protected async envoyer(): Promise<void> {
    if (!this.nom.trim() || !this.email.trim() || !this.message.trim()) {
      this.erreur.set(
        this.i18n.t(
          'Merci de renseigner votre nom, votre e-mail et votre message.',
          'Please fill in your name, email and message.',
        ),
      );
      return;
    }
    this.erreur.set('');
    this.enCours.set(true);
    try {
      const r = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: this.nom,
          email: this.email,
          telephone: this.telephone,
          formule: this.formule,
          message: this.message,
          siteWeb: this.siteWeb,
        }),
      });
      if (r.ok) this.envoye.set(true);
      else this.erreur.set((await r.json().catch(() => null))?.erreur ?? this.i18n.t("L'envoi a échoué. Merci de réessayer.", 'Sending failed. Please try again.'));
    } catch {
      this.erreur.set(
        this.i18n.t(
          "L'envoi a échoué. Vérifiez votre connexion et réessayez.",
          'Sending failed. Please check your connection and try again.',
        ),
      );
    } finally {
      this.enCours.set(false);
    }
  }
}
