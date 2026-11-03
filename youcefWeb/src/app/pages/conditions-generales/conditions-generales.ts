import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-conditions-generales',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="conteneur contenu">
        <p class="sur-titre">Règlement</p>
        <h1>Conditions générales</h1>

        <div class="carte bloc">
          <h2>Objet des services</h2>
          <p>
            Les services proposés sur ce site sont destinés à accompagner les personnes dans leur
            développement personnel, leur organisation et leur évolution professionnelle ou personnelle.
          </p>
          <p>
            L’utilisation du site et des services associés suppose le respect des présentes conditions
            générales, ainsi que des règles de courtoisie et de confidentialité applicables à toute
            relation de confiance.
          </p>
        </div>

        <div class="carte bloc">
          <h2>Réservation et planning</h2>
          <p>
            Les disponibilités, les rendez-vous et les modalités de suivi peuvent être ajustées selon les
            contraintes de planning, la disponibilité du coach et les besoins de chacun.
          </p>
          <p>
            Toute réservation de séance est soumise à validation et peut être modifiée ou annulée selon
            les conditions prévues lors de l’échange ou du suivi.
          </p>
        </div>

        <div class="carte bloc">
          <h2>Responsabilité et usage</h2>
          <p>
            Le site vise à fournir un cadre de travail et d’échange utile à l’accompagnement, sans se
            substituer à des interventions spécialisées ou à un suivi médical, psychologique ou juridique
            spécifique.
          </p>
          <p>
            Chaque utilisateur est responsable de l’usage qu’il fait des informations, des services et des
            échanges mis à sa disposition.
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
export class ConditionsGenerales {}
