import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-mentions-legales',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="conteneur contenu">
        <p class="sur-titre">Informations légales</p>
        <h1>Mentions légales</h1>

        <div class="carte bloc">
          <h2>Éditeur du site</h2>
          <p>
            Le site <strong>Youcef Tahri</strong> est édité par Youcef Tahri, coach en développement
            personnel et formateur en gestion interpersonnelle.
          </p>
          <p>
            Le site est hébergé sur une infrastructure sécurisée et maintenue dans le respect des
            bonnes pratiques de gestion de la sécurité et de la confidentialité.
          </p>
        </div>

        <div class="carte bloc">
          <h2>Contact</h2>
          <p>
            Pour toute demande de contact, vous pouvez utiliser les moyens de communication mis à votre
            disposition depuis la page d’accueil ou via l’espace membre.
          </p>
        </div>

        <div class="actions">
          <a routerLink="/" class="btn">← Retour à l'accueil</a>
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
export class MentionsLegales {}
