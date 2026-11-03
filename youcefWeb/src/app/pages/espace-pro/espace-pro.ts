import { Component, computed, inject } from '@angular/core';
import { UTILISATEURS } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { classeStatut } from '../../core/models';

@Component({
  selector: 'app-espace-pro',
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Espace professionnel</span>
        <h1>Bonjour Youcef</h1>
        <div class="stats">
          <div><strong>{{ enAttente() }}</strong><span>demandes à traiter</span></div>
          <div><strong>{{ acceptees() }}</strong><span>acceptées</span></div>
          <div><strong>{{ clients.length }}</strong><span>clients</span></div>
        </div>
      </div>
    </section>

    <div class="conteneur grille">
      <section class="carte">
        <h2>Demandes de rendez-vous</h2>
        @for (d of demandes(); track d.id) {
          <article class="demande">
            <span class="avatar">{{ nomClient(d.clientId).charAt(0) }}</span>
            <div class="corps">
              <div class="titre">
                <strong>{{ nomClient(d.clientId) }}</strong>
                <small>{{ d.offre }} · {{ d.date }}</small>
              </div>
              <p>{{ d.message }}</p>
            </div>
            @if (d.statut === 'en attente') {
              <div class="actions">
                <button class="btn petit" (click)="data.changerStatut(d.id, 'acceptée')">Accepter</button>
                <button class="btn secondaire petit" (click)="data.changerStatut(d.id, 'refusée')">Refuser</button>
              </div>
            } @else {
              <span class="badge" [class]="'badge ' + classe(d.statut)">{{ d.statut }}</span>
            }
          </article>
        } @empty {
          <p class="vide">Aucune demande pour le moment. Elles apparaîtront ici dès qu'un client en enverra une.</p>
        }
      </section>

      <section class="carte">
        <h2>Mes clients</h2>
        @for (c of clients; track c.id) {
          <details>
            <summary>
              <span class="avatar">{{ c.nom.charAt(0) }}</span>
              <span class="nom">{{ c.nom }}</span>
              <small>{{ data.documentsDe(c.id).length }} document(s)</small>
            </summary>
            <ul>
              @for (d of data.documentsDe(c.id); track d.id) {
                <li>{{ d.titre }} <small>· {{ d.date }}</small></li>
              } @empty {
                <li class="vide">Aucun document.</li>
              }
            </ul>
          </details>
        }
      </section>
    </div>
  `,
  styles: `
    .bandeau {
      padding: 3.5rem 0 4.5rem;
      background: linear-gradient(135deg, var(--bleu-profond), var(--bleu-nuit));
      color: var(--ivoire-clair);
      h1 { color: var(--ivoire-clair); font-size: clamp(2.4rem, 5vw, 3.6rem); margin-bottom: 1.8rem; }
    }
    .stats { display: flex; flex-wrap: wrap; gap: 1rem; }
    .stats div {
      min-width: 150px;
      padding: 1rem 1.4rem;
      border: 1px solid rgba(250, 246, 240, 0.18);
      border-radius: 16px;
      background: rgba(250, 246, 240, 0.06);
    }
    .stats strong { display: block; font-family: var(--serif); font-size: 2.4rem; line-height: 1; color: var(--bleu-diamant); }
    .stats span { font-size: 0.85rem; opacity: 0.75; }

    .grille {
      display: grid;
      grid-template-columns: 1.5fr 1fr;
      gap: 1.6rem;
      align-items: start;
      margin-top: -2.2rem;
      padding-bottom: 4rem;
    }
    h2 { font-size: 1.9rem; margin-bottom: 1rem; }
    .vide { color: var(--texte-doux); margin: 0; }

    .demande {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.1rem 0;
      border-top: 1px solid rgba(10, 29, 53, 0.07);
    }
    .corps { flex: 1; min-width: 0; }
    .titre { display: flex; flex-direction: column; line-height: 1.35; }
    .titre small { color: var(--texte-doux); }
    .corps p { margin: 0.5rem 0 0; padding: 0.7rem 0.9rem; border-radius: 12px; background: var(--ivoire-clair); font-size: 0.93rem; overflow-wrap: anywhere; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; }

    details { border-top: 1px solid rgba(10, 29, 53, 0.07); }
    summary {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.9rem 0;
      cursor: pointer;
      list-style: none;
      &::-webkit-details-marker { display: none; }
      .nom { flex: 1; font-weight: 600; }
      small { color: var(--texte-doux); }
    }
    details[open] summary .nom { color: var(--bleu-nuit); }
    ul { margin: 0 0 1rem 3.4rem; padding: 0; list-style: none; font-size: 0.93rem; }
    li { padding: 0.35rem 0; }
    li small { color: var(--texte-doux); }

    @media (max-width: 900px) {
      .grille { grid-template-columns: 1fr; }
      .demande { flex-wrap: wrap; }
      .actions { flex-direction: row; }
    }
  `,
})
export class EspacePro {
  protected readonly data = inject(DataService);
  protected readonly clients = UTILISATEURS.filter((u) => u.role === 'client');
  protected readonly demandes = computed(() => this.data.demandes());
  protected readonly enAttente = computed(() => this.demandes().filter((d) => d.statut === 'en attente').length);
  protected readonly acceptees = computed(() => this.demandes().filter((d) => d.statut === 'acceptée').length);
  protected readonly classe = classeStatut;

  protected nomClient(id: string): string {
    return UTILISATEURS.find((u) => u.id === id)?.nom ?? 'Client inconnu';
  }
}
