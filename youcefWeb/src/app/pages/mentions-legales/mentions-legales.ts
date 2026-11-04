import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, TrPipe } from '../../core/i18n';

@Component({
  selector: 'app-mentions-legales',
  imports: [RouterLink, TrPipe],
  template: `
    <section class="page">
      <div class="conteneur contenu">
        @if (i18n.langue() === 'en') {
          <p class="aide">This is a courtesy translation; the French version prevails.</p>
        }
        <p class="sur-titre">{{ 'Informations légales' | tr: 'Legal information' }}</p>
        <h1>{{ 'Mentions légales' | tr: 'Legal notice' }}</h1>

        <div class="carte bloc">
          <h2>{{ 'Éditeur du site' | tr: 'Site publisher' }}</h2>
          <p>
            @if (i18n.langue() === 'fr') {
              Le site <strong>Youcef Tahri</strong> est édité par Youcef Tahri, coach en développement
              personnel et formateur en gestion interpersonnelle.
            } @else {
              The <strong>Youcef Tahri</strong> website is published by Youcef Tahri, personal development
              coach and trainer in interpersonal management.
            }
          </p>
          <p>
            {{ 'Le site est hébergé sur une infrastructure sécurisée et maintenue dans le respect des bonnes pratiques de gestion de la sécurité et de la confidentialité.' | tr: 'The site is hosted on a secure infrastructure, maintained in accordance with good security and confidentiality management practices.' }}
          </p>
        </div>

        <div class="carte bloc">
          <h2>{{ 'Contact' | tr: 'Contact' }}</h2>
          <p>
            {{ 'Pour toute demande de contact, vous pouvez utiliser les moyens de communication mis à votre disposition depuis la page d’accueil ou via l’espace membre.' | tr: 'For any contact request, you may use the means of communication made available to you from the home page or through the member area.' }}
          </p>
        </div>

        <div class="actions">
          <a routerLink="/" class="btn">{{ '← Retour à l'accueil' | tr: '← Back to home' }}</a>
        </div>
      </div>
    </section>
  `,
  styles: `
    .page {
      padding: 4rem 0 5rem;
      background: linear-gradient(180deg, rgba(15, 42, 67, 0.04), rgba(15, 42, 67, 0));
    }
    .contenu {
      max-width: 860px;
      margin: 0 auto;
    }
    h1 {
      margin-bottom: 2rem;
      font-size: clamp(2.2rem, 4vw, 3.4rem);
      color: var(--bleu-profond);
    }
    .bloc {
      margin-bottom: 1.5rem;
    }
    h2 {
      margin-bottom: 0.75rem;
      font-size: 1.5rem;
      color: var(--bleu-profond);
    }
    p {
      margin: 0 0 1rem;
      color: var(--texte-doux);
      line-height: 1.7;
    }
    p:last-child { margin-bottom: 0; }
    .actions {
      margin-top: 2rem;
    }
  `,
})
export class MentionsLegales {
  protected readonly i18n = inject(I18n);
}
