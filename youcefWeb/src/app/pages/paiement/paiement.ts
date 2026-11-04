import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { I18n, TrPipe } from '../../core/i18n';
import { trouverFormation } from '../../core/formations';

@Component({
  selector: 'app-paiement',
  imports: [RouterLink, TrPipe],
  template: `
    <main class="page">
      <div class="conteneur">
        @if (formation) {
          <a [routerLink]="['/formations', formation.slug]" class="retour">{{ '← Retour à la formation' | tr: '← Back to the course' }}</a>
        } @else {
          <a routerLink="/espace-client" class="retour">{{ '← Retour à mon espace' | tr: '← Back to my space' }}</a>
        }

        @if (paye()) {
          <section class="confirmation carte" role="status">
            <span class="icone" aria-hidden="true">✓</span>
            <span class="sur-titre">{{ 'Simulation terminée' | tr: 'Simulation complete' }}</span>
            <h1>{{ 'Tout est prêt !' | tr: 'All set!' }}</h1>
            <p>
              {{
                'Ceci est une démonstration : aucun paiement réel n’a été effectué et aucune donnée bancaire n’a été transmise.'
                  | tr: 'This is a demo: no real payment was made and no bank details were sent.'
              }}
            </p>
            <a routerLink="/" class="btn">{{ "Retour à l'accueil" | tr: 'Back to home' }}</a>
          </section>
        } @else {
          <section class="entete">
            <span class="sur-titre">{{ 'Espace client' | tr: 'Client area' }}</span>
            <h1>{{ 'Finaliser le règlement' | tr: 'Complete your payment' }}</h1>
            <p>{{ 'Un aperçu du paiement en ligne de vos séances.' | tr: 'A preview of online payment for your sessions.' }}</p>
          </section>

          <div class="grille">
            <section class="carte commande">
              <h2>{{ 'Récapitulatif' | tr: 'Order summary' }}</h2>
              <div class="ligne">
                <span>{{ libelle() }}</span>
                <strong>{{ montantAffiche() }}</strong>
              </div>
              <div class="total">
                <span>{{ 'Total à régler' | tr: 'Total due' }}</span>
                <strong>{{ montantAffiche() }}</strong>
              </div>
              <p class="note">{{ 'Tarif fictif de démonstration, à adapter.' | tr: 'Fictional demo price, to be adjusted.' }}</p>
            </section>

            <section class="carte">
              <div class="alerte" role="note">
                <strong>{{ 'Démonstration uniquement' | tr: 'Demo only' }}</strong>
                <span>
                  {{
                    'N’utilisez pas de vraie carte. Les données affichées sont fictives et ne seront ni envoyées ni enregistrées.'
                      | tr: 'Do not use a real card. The displayed details are fictional and will not be sent or stored.'
                  }}
                </span>
              </div>

              <form (submit)="simuler($event)">
                <h2>{{ 'Paiement par carte' | tr: 'Card payment' }}</h2>
                <label for="titulaire">{{ 'Titulaire de la carte' | tr: 'Cardholder name' }}</label>
                <input id="titulaire" value="Camille Exemple" autocomplete="off" required />

                <label for="numero">{{ 'Numéro de carte (fictif)' | tr: 'Card number (fictional)' }}</label>
                <input id="numero" value="4242 4242 4242 4242" inputmode="numeric" autocomplete="off" required />

                <div class="champs">
                  <div>
                    <label for="expiration">{{ 'Expiration' | tr: 'Expiry date' }}</label>
                    <input id="expiration" value="12/30" autocomplete="off" required />
                  </div>
                  <div>
                    <label for="cryptogramme">{{ 'Cryptogramme fictif' | tr: 'Fictional security code' }}</label>
                    <input id="cryptogramme" value="123" inputmode="numeric" autocomplete="off" required />
                  </div>
                </div>

                <button class="btn large" type="submit">{{ 'Simuler le paiement de' | tr: 'Simulate payment of' }} {{ montantAffiche() }}</button>
              </form>
            </section>
          </div>
          <p class="securite">{{ 'Aucune transaction bancaire ne sera effectuée.' | tr: 'No bank transaction will be made.' }}</p>
        }
      </div>
    </main>
  `,
  styles: `
    .page { min-height: calc(100dvh - 4.5rem); padding: 3rem 0 5rem; }
    .retour { display: inline-block; margin-bottom: 2rem; color: var(--texte-doux); text-decoration: none; }
    .retour:hover { color: var(--bleu-profond); }
    .entete { margin-bottom: 2rem; }
    h1 { font-size: clamp(2.4rem, 5vw, 3.5rem); margin-bottom: 0.4rem; }
    .entete p, .note, .securite { color: var(--texte-doux); }
    .grille { display: grid; grid-template-columns: 0.85fr 1.15fr; align-items: start; gap: 1.5rem; }
    h2 { font-size: 1.6rem; margin-bottom: 1.2rem; }
    .ligne, .total { display: flex; justify-content: space-between; gap: 1rem; }
    .ligne { padding: 1rem 0; border-bottom: 1px solid rgba(10, 29, 53, 0.1); }
    .total { padding-top: 1.2rem; font-size: 1.1rem; }
    .total strong { color: var(--bleu-profond); font-size: 1.35rem; }
    .note { margin: 1rem 0 0; font-size: 0.85rem; }
    .alerte { display: grid; gap: 0.2rem; margin-bottom: 1.2rem; padding: 0.9rem 1rem; border-radius: 12px; background: #fff3da; color: #654b1e; font-size: 0.88rem; }
    .alerte strong { font-size: 0.95rem; }
    label { margin-top: 0.8rem; }
    input { background: var(--blanc); }
    .champs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    form .btn { margin-top: 1.5rem; }
    .securite { margin-top: 1rem; text-align: center; font-size: 0.85rem; }
    .confirmation { max-width: 620px; margin: 4rem auto; text-align: center; }
    .confirmation h1 { margin-top: 0.7rem; }
    .confirmation p { color: var(--texte-doux); }
    .icone { display: grid; place-items: center; width: 52px; height: 52px; margin: 0 auto 1.2rem; border-radius: 50%; background: #d6eee2; color: var(--succes); font-size: 1.7rem; font-weight: 700; }
    @media (max-width: 760px) {
      .grille { grid-template-columns: 1fr; }
      .page { padding-top: 2rem; }
    }
  `,
})
export class Paiement {
  private readonly i18n = inject(I18n);
  protected readonly formation = trouverFormation(inject(ActivatedRoute).snapshot.queryParamMap.get('formation'));
  private readonly montant = this.formation?.prix ?? 80;
  protected readonly montantAffiche = () => `${this.montant.toFixed(2).replace('.', ',')} €`;
  protected readonly libelle = () =>
    this.formation
      ? this.i18n.t(this.formation.titre[0], this.formation.titre[1])
      : this.i18n.t('Séance de coaching · exemple', 'Coaching session · example');

  protected readonly paye = signal(false);

  protected simuler(event: SubmitEvent): void {
    event.preventDefault();
    this.paye.set(true);
  }
}
