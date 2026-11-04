import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { I18n, TrPipe } from '../../core/i18n';

@Component({
  selector: 'app-conditions-generales',
  imports: [RouterLink, TrPipe],
  template: `
    <section class="page">
      <div class="conteneur contenu">
        @if (i18n.langue() === 'en') {
          <p class="aide">This is a courtesy translation; the French version prevails.</p>
        }
        <p class="sur-titre">{{ 'Règlement' | tr: 'Rules' }}</p>
        <h1>{{ 'Conditions générales' | tr: 'Terms and conditions' }}</h1>

        <div class="carte bloc">
          <h2>{{ 'Objet des services' | tr: 'Purpose of the services' }}</h2>
          <p>
            {{ 'Les services proposés sur ce site sont destinés à accompagner les personnes dans leur développement personnel, leur organisation et leur évolution professionnelle ou personnelle.' | tr: 'The services offered on this site are intended to support people in their personal development, their organisation and their professional or personal growth.' }}
          </p>
          <p>
            {{ 'L’utilisation du site et des services associés suppose le respect des présentes conditions générales, ainsi que des règles de courtoisie et de confidentialité applicables à toute relation de confiance.' | tr: 'Use of the site and the associated services requires compliance with these terms and conditions, as well as with the rules of courtesy and confidentiality applicable to any relationship of trust.' }}
          </p>
        </div>

        <div class="carte bloc">
          <h2>{{ 'Réservation et planning' | tr: 'Booking and scheduling' }}</h2>
          <p>
            {{ 'Les disponibilités, les rendez-vous et les modalités de suivi peuvent être ajustées selon les contraintes de planning, la disponibilité du coach et les besoins de chacun.' | tr: 'Availability, appointments and follow-up arrangements may be adjusted according to scheduling constraints, the coach’s availability and each person’s needs.' }}
          </p>
          <p>
            {{ 'Toute réservation de séance est soumise à validation et peut être modifiée ou annulée selon les conditions prévues lors de l’échange ou du suivi.' | tr: 'Any session booking is subject to confirmation and may be modified or cancelled according to the conditions set out during the discussion or follow-up.' }}
          </p>
        </div>

        <div class="carte bloc">
          <h2>{{ 'Responsabilité et usage' | tr: 'Responsibility and use' }}</h2>
          <p>
            {{ 'Le site vise à fournir un cadre de travail et d’échange utile à l’accompagnement, sans se substituer à des interventions spécialisées ou à un suivi médical, psychologique ou juridique spécifique.' | tr: 'The site aims to provide a working and discussion framework useful for coaching, without replacing specialised interventions or specific medical, psychological or legal care.' }}
          </p>
          <p>
            {{ 'Chaque utilisateur est responsable de l’usage qu’il fait des informations, des services et des échanges mis à sa disposition.' | tr: 'Each user is responsible for the use they make of the information, services and exchanges made available to them.' }}
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
export class ConditionsGenerales {
  protected readonly i18n = inject(I18n);
}
