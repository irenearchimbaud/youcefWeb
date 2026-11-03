import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { classeStatut, formaterCreneau } from '../../core/models';
import { DUREE_SEANCE_MIN, HORIZON_JOURS, Intervalle, creneauxLibres } from '../../core/creneaux';

@Component({
  selector: 'app-espace-client',
  imports: [FormsModule],
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Mon espace</span>
        <h1>Bonjour {{ prenom() }}</h1>
        <div class="stats">
          <div><strong>{{ utilisateur().solde }}</strong><span>séance(s) restante(s)</span></div>
          <div><strong>{{ acceptees() }}</strong><span>séance(s) confirmée(s)</span></div>
          <div><strong>{{ documents().length }}</strong><span>documents</span></div>
        </div>
      </div>
    </section>

    <div class="conteneur grille">
      <div class="colonne">
        <section class="carte">
          <h2>Mes documents</h2>
          @for (d of documents(); track d.id) {
            <div class="ligne">
              <span class="icone" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h6"/></svg>
              </span>
              <div class="infos">
                <strong>{{ d.titre }}</strong>
                <small>{{ d.date }}</small>
              </div>
            </div>
          } @empty {
            <p class="vide">Aucun document pour le moment.</p>
          }
        </section>

        <section class="carte">
          <h2>Mes séances</h2>
          @for (d of demandes(); track d.id) {
            <div class="ligne">
              <div class="infos">
                <strong>{{ creneau(d.debut, d.fin) }}</strong>
                <small>Demandée le {{ d.date }}</small>
              </div>
              <span class="badge" [class]="'badge ' + classe(d.statut)">{{ d.statut }}</span>
            </div>
          } @empty {
            <p class="vide">Vous n'avez pas encore réservé de séance.</p>
          }
        </section>
      </div>

      <aside class="carte demande">
        <h2>Réserver une séance</h2>
        @if (reservable() < 1) {
          <p class="aide">
            @if (utilisateur().solde < 1) {
              Votre solde de séances est épuisé. Contactez Youcef pour en obtenir de nouvelles.
            } @else {
              Toutes vos séances restantes sont déjà en attente de validation par Youcef.
            }
          </p>
        } @else {
          <p class="aide">
            Choisissez un créneau parmi les disponibilités de Youcef. Il confirme ensuite votre demande,
            et la séance est décomptée de votre solde à ce moment-là.
          </p>
          @if (chargement()) {
            <p class="aide">Chargement des disponibilités…</p>
          } @else if (!jours().length) {
            <p class="vide">Aucun créneau disponible pour le moment.</p>
          } @else {
            <div class="jours" role="group" aria-label="Jour">
              @for (j of jours(); track j.cle) {
                <button type="button" class="puce" [class.actif]="jourActif().cle === j.cle" (click)="choisirJour(j.cle)">
                  <span>{{ jourCourt(j.date) }}</span>
                  <strong>{{ j.date.getDate() }}</strong>
                  <span>{{ moisCourt(j.date) }}</span>
                </button>
              }
            </div>
            <div class="heures" role="group" aria-label="Heure">
              @for (c of jourActif().creneaux; track c.debut.getTime()) {
                <button type="button" class="puce heure" [class.actif]="choix()?.getTime() === c.debut.getTime()" (click)="choix.set(c.debut)">
                  {{ heure(c.debut) }}
                </button>
              }
            </div>
            <form (ngSubmit)="envoyer()">
              <label for="msg">Un mot pour Youcef <small>(facultatif)</small></label>
              <textarea id="msg" name="msg" rows="3" [(ngModel)]="message"
                placeholder="Ce que vous souhaitez aborder…"></textarea>
              <button class="btn large" type="submit" [disabled]="!choix() || envoi()">
                {{ envoi() ? 'Envoi…' : 'Envoyer ma demande' }}
              </button>
            </form>
          }
          @if (agendaIndisponible()) {
            <p class="aide">L'agenda n'a pas pu être consulté : certains créneaux affichés peuvent déjà être pris.</p>
          }
        }
        @if (retour()) {
          <p class="retour" role="status">{{ retour() }}</p>
        }
      </aside>
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
      grid-template-columns: 1.4fr 1fr;
      gap: 1.6rem;
      align-items: start;
      margin-top: -2.2rem;
      padding-bottom: 4rem;
    }
    .colonne { display: grid; gap: 1.6rem; }
    h2 { font-size: 1.9rem; margin-bottom: 1rem; }

    .ligne {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 0;
      border-top: 1px solid rgba(10, 29, 53, 0.07);
    }
    .infos { flex: 1; display: flex; flex-direction: column; line-height: 1.35; }
    .infos small { color: var(--texte-doux); }
    .icone {
      display: grid;
      place-items: center;
      width: 42px;
      height: 42px;
      border-radius: 12px;
      background: var(--bleu-diamant);
      color: var(--bleu-nuit);
    }
    .vide { color: var(--texte-doux); margin: 0; }

    .demande { position: sticky; top: 6rem; }
    .aide { color: var(--texte-doux); font-size: 0.93rem; }
    .demande .btn { margin-top: 1.4rem; }
    label small { font-weight: 400; color: var(--texte-doux); }
    .retour { margin: 1rem 0 0; font-weight: 600; color: var(--succes); font-size: 0.92rem; }

    .jours, .heures { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .puce {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 3.6rem;
      padding: 0.5rem 0.7rem;
      border: 1.5px solid var(--champagne);
      border-radius: 14px;
      background: var(--ivoire-clair);
      font: 500 0.78rem var(--sans);
      color: var(--texte);
      cursor: pointer;
      transition: background 0.2s, border-color 0.2s;
      strong { font-family: var(--serif); font-size: 1.5rem; line-height: 1.1; }
      &:hover { border-color: var(--bleu-clair); }
      &.actif { background: var(--bleu-profond); border-color: var(--bleu-profond); color: var(--ivoire-clair); strong { color: var(--ivoire-clair); } }
      &.heure { flex-direction: row; font-size: 0.9rem; padding: 0.5rem 1rem; }
    }

    @media (max-width: 900px) {
      .grille { grid-template-columns: 1fr; }
      .demande { position: static; }
    }
  `,
})
export class EspaceClient {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly utilisateur = computed(() => this.auth.utilisateur()!);
  protected readonly prenom = computed(() => this.utilisateur().nom.split(' ')[0]);
  protected readonly documents = computed(() => this.data.documentsDe(this.utilisateur().id));
  protected readonly demandes = computed(() => this.data.demandesDe(this.utilisateur().id));
  protected readonly acceptees = computed(() => this.demandes().filter((d) => d.statut === 'acceptée').length);
  protected readonly classe = classeStatut;
  protected readonly creneau = formaterCreneau;

  /** Séances encore réservables : le solde moins les demandes déjà en attente. */
  protected readonly reservable = computed(() => this.data.soldeDisponible(this.utilisateur().id));

  // Plages occupées dans le Google Agenda de Youcef (vide tant que l'agenda n'est pas connecté).
  private readonly agenda = signal<Intervalle[]>([]);
  protected readonly chargement = signal(this.navigateur);
  protected readonly agendaIndisponible = signal(false);

  protected readonly jours = computed(() => {
    const pris = this.data
      .demandes()
      .filter((d) => d.statut !== 'refusée')
      .map((d) => ({ debut: new Date(d.debut), fin: new Date(d.fin) }));
    return creneauxLibres(this.data.disponibilites(), [...this.agenda(), ...pris], new Date());
  });

  private readonly cleJour = signal<string | null>(null);
  protected readonly jourActif = computed(() => this.jours().find((j) => j.cle === this.cleJour()) ?? this.jours()[0]);
  protected readonly choix = signal<Date | null>(null);
  protected message = '';

  protected readonly envoi = signal(false);
  protected readonly retour = signal('');

  constructor() {
    if (this.navigateur) void this.chargerAgenda();
  }

  protected choisirJour(cle: string): void {
    this.cleJour.set(cle);
    this.choix.set(null);
  }

  protected jourCourt = (d: Date) => d.toLocaleDateString('fr-FR', { weekday: 'short' });
  protected moisCourt = (d: Date) => d.toLocaleDateString('fr-FR', { month: 'short' });
  protected heure = (d: Date) => d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

  private async chargerAgenda(): Promise<void> {
    const debut = new Date();
    const fin = new Date(debut.getTime() + (HORIZON_JOURS + 1) * 86_400_000);
    try {
      const reponse = await fetch(`/api/google/occupe?debut=${debut.toISOString()}&fin=${fin.toISOString()}`);
      if (!reponse.ok) throw new Error(String(reponse.status));
      const { occupe } = (await reponse.json()) as { occupe: { start: string; end: string }[] };
      this.agenda.set(occupe.map((o) => ({ debut: new Date(o.start), fin: new Date(o.end) })));
    } catch {
      this.agendaIndisponible.set(true);
    } finally {
      this.chargement.set(false);
    }
  }

  protected async envoyer(): Promise<void> {
    const debut = this.choix();
    if (!debut || this.reservable() < 1) return;
    const fin = new Date(debut.getTime() + DUREE_SEANCE_MIN * 60_000);
    const message = this.message.trim();
    this.envoi.set(true);
    this.retour.set('');
    try {
      const reponse = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: this.utilisateur().nom, debut: debut.toISOString(), message }),
      });
      if (!reponse.ok) throw new Error(String(reponse.status));
      this.data.ajouterDemande(this.utilisateur().id, debut.toISOString(), fin.toISOString(), message);
      this.message = '';
      this.choix.set(null);
      this.retour.set('Votre demande a bien été envoyée à Youcef.');
    } catch {
      this.retour.set("L'envoi a échoué, merci de réessayer dans un instant.");
    } finally {
      this.envoi.set(false);
    }
  }
}
