import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-politique-confidentialite',
  imports: [RouterLink],
  template: `
    <section class="page">
      <div class="conteneur contenu">
        <p class="sur-titre">Protection des données</p>
        <h1>Politique de confidentialité</h1>

        <div class="carte bloc">
          <h2>Traitement des données personnelles</h2>
          <p>
            Nous collectons uniquement les informations nécessaires au bon fonctionnement des services,
            notamment pour la gestion des échanges, des séances et des documents partagés au sein de
            l’espace membre.
          </p>
          <p>
            Les données sont utilisées uniquement dans le cadre de l’accompagnement proposé et ne sont
            ni vendues ni cédées à des tiers, sauf dans le cas où la loi l’exige ou où cela est nécessaire
            à la fourniture du service.
          </p>
          <p>
            Vous disposez d’un droit d’accès, de rectification, d’opposition, de limitation et de
            suppression des données vous concernant. Pour exercer ces droits, vous pouvez contacter
            directement Youcef Tahri.
          </p>
        </div>

        <div class="carte bloc">
          <h2>Sécurité et conservation</h2>
          <p>
            Les informations sont conservées uniquement le temps nécessaire à la gestion de votre
            accompagnement et des services associés.
          </p>
          <p>
            Des mesures techniques et organisationnelles sont mises en œuvre afin de protéger les
            données contre toute perte, altération ou accès non autorisé.
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
export class PolitiqueConfidentialite {}
