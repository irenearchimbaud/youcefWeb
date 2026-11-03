import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Demande, Utilisateur, classeStatut, formaterCreneau } from '../../core/models';

const JOURS = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

@Component({
  selector: 'app-espace-pro',
  imports: [FormsModule],
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Espace professionnel</span>
        <h1>Bonjour Youcef</h1>
        <div class="stats">
          <div><strong>{{ enAttente() }}</strong><span>demandes à traiter</span></div>
          <div><strong>{{ acceptees() }}</strong><span>séances confirmées</span></div>
          <div><strong>{{ clients().length }}</strong><span>clients</span></div>
        </div>
      </div>
    </section>

    <div class="conteneur grille">
      <div class="colonne">
        <section class="carte">
          <h2>Demandes de séance</h2>
          @if (erreur()) {
            <p class="erreur" role="alert">{{ erreur() }}</p>
          }
          @for (d of demandes(); track d.id) {
            <article class="demande">
              <span class="avatar">{{ nomClient(d).charAt(0) }}</span>
              <div class="corps">
                <div class="titre">
                  <strong>{{ nomClient(d) }}</strong>
                  <small>{{ creneau(d.debut, d.fin) }}</small>
                  <small>Solde : {{ soldeClient(d) }} séance(s)</small>
                </div>
                @if (d.message) {
                  <p>{{ d.message }}</p>
                }
              </div>
              @if (d.statut === 'en attente') {
                <div class="actions">
                  <button class="btn petit" [disabled]="occupe() === d.id || soldeClient(d) < 1" (click)="accepter(d)">
                    {{ occupe() === d.id ? '…' : 'Accepter' }}
                  </button>
                  <button class="btn secondaire petit" [disabled]="occupe() === d.id" (click)="data.refuser(d.id)">Refuser</button>
                </div>
              } @else {
                <span class="badge" [class]="'badge ' + classe(d.statut)">{{ d.statut }}</span>
              }
            </article>
          } @empty {
            <p class="vide">Aucune demande pour le moment. Elles apparaîtront ici dès qu'un client réservera un créneau.</p>
          }
        </section>

        <section class="carte">
          <h2>Mes disponibilités</h2>
          <p class="aide">
            Plages hebdomadaires où vos clients peuvent réserver, par séances d'une heure.
            Les moments déjà pris dans votre Google Agenda sont retirés automatiquement.
          </p>
          @for (d of dispos; track d.jour) {
            <div class="dispo">
              <label class="jour">
                <input type="checkbox" [name]="'actif' + d.jour" [(ngModel)]="d.actif" (ngModelChange)="sauverDispos()" />
                {{ jours[d.jour] }}
              </label>
              <input type="time" [name]="'debut' + d.jour" [(ngModel)]="d.debut" (ngModelChange)="sauverDispos()"
                [disabled]="!d.actif" [attr.aria-label]="'Début ' + jours[d.jour]" />
              <span aria-hidden="true">–</span>
              <input type="time" [name]="'fin' + d.jour" [(ngModel)]="d.fin" (ngModelChange)="sauverDispos()"
                [disabled]="!d.actif" [attr.aria-label]="'Fin ' + jours[d.jour]" />
              @if (d.actif && d.fin <= d.debut) {
                <small class="erreur">Fin avant le début</small>
              }
            </div>
          }
        </section>
      </div>

      <div class="colonne">
        <section class="carte">
          <h2>Google Agenda</h2>
          @if (retourGoogle() === 'ok') {
            <p class="succes" role="status">Agenda connecté.</p>
          } @else if (retourGoogle() === 'erreur') {
            <p class="erreur" role="alert">La connexion à Google a échoué, merci de réessayer.</p>
          }
          @if (google() === null) {
            <p class="vide">Vérification…</p>
          } @else if (!google()!.configure) {
            <p class="aide">
              Les identifiants Google ne sont pas encore renseignés sur le serveur
              (<code>GOOGLE_CLIENT_ID</code> et <code>GOOGLE_CLIENT_SECRET</code>).
            </p>
          } @else if (google()!.connecte) {
            <p class="aide">
              Connecté : vos créneaux occupés sont masqués, et chaque séance acceptée est ajoutée à votre agenda avec un lien de visio.
            </p>
            <button class="btn secondaire petit" (click)="deconnecterGoogle()">Déconnecter</button>
          } @else {
            <p class="aide">
              Connectez votre agenda pour masquer automatiquement vos créneaux occupés et y ajouter les séances acceptées.
            </p>
            <a class="btn petit" href="/api/google/connexion">Connecter Google Agenda</a>
          }
        </section>

        <section class="carte">
          <h2>Mes clients</h2>
          <form class="ajout" (ngSubmit)="ajouterClient()">
            <label for="nom">Nouveau client</label>
            <input id="nom" name="nom" [(ngModel)]="nouveauNom" placeholder="Prénom Nom" required />
            <label for="solde">Séances achetées</label>
            <input id="solde" name="solde" type="number" min="1" max="200" [(ngModel)]="nouveauSolde" required />
            <button class="btn petit" type="submit" [disabled]="!nouveauNom.trim() || nouveauSolde < 1">Créer l'espace</button>
          </form>

          @if (cree(); as c) {
            <div class="acces" role="status">
              <strong>Espace créé pour {{ c.nom }}</strong>
              <span>Identifiant : <code>{{ c.identifiant }}</code></span>
              <span>Code d'accès : <code>{{ c.code }}</code></span>
              <small>À transmettre au client.</small>
            </div>
          }

          @for (c of clients(); track c.id) {
            <article class="client">
              <span class="avatar">{{ c.nom.charAt(0) }}</span>
              <div class="corps">
                <strong>{{ c.nom }}</strong>
                <small>{{ c.identifiant }} · <code>{{ c.code }}</code></small>
              </div>
              <div class="solde" role="group" [attr.aria-label]="'Solde de ' + c.nom">
                <button type="button" (click)="data.ajusterSolde(c.id, -1)" [disabled]="c.solde < 1" aria-label="Retirer une séance">−</button>
                <span><strong>{{ c.solde }}</strong> séance(s)</span>
                <button type="button" (click)="data.ajusterSolde(c.id, 1)" aria-label="Ajouter une séance">+</button>
              </div>
              <div class="outils">
                <button type="button" class="lien" (click)="regenerer(c)">Nouveau code</button>
                <button type="button" class="lien danger" (click)="supprimer(c)">Supprimer</button>
              </div>
            </article>
          } @empty {
            <p class="vide">Aucun client pour le moment.</p>
          }
        </section>
      </div>
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
    .colonne { display: grid; gap: 1.6rem; min-width: 0; }
    h2 { font-size: 1.9rem; margin-bottom: 1rem; }
    .vide { color: var(--texte-doux); margin: 0; }
    .aide { color: var(--texte-doux); font-size: 0.93rem; }
    .erreur { color: var(--danger); font-size: 0.9rem; font-weight: 500; margin: 0 0 0.8rem; }
    .succes { color: var(--succes); font-size: 0.92rem; font-weight: 600; margin: 0 0 0.8rem; }
    code { padding: 0.1rem 0.4rem; border-radius: 6px; background: var(--ivoire-clair); font-size: 0.85em; letter-spacing: 0.04em; }

    .demande, .client {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1.1rem 0;
      border-top: 1px solid rgba(10, 29, 53, 0.07);
    }
    .corps { flex: 1; min-width: 0; line-height: 1.35; display: flex; flex-direction: column; }
    .corps small, .titre small { color: var(--texte-doux); }
    .titre { display: flex; flex-direction: column; line-height: 1.35; }
    .corps p { margin: 0.5rem 0 0; padding: 0.7rem 0.9rem; border-radius: 12px; background: var(--ivoire-clair); font-size: 0.93rem; overflow-wrap: anywhere; }
    .actions { display: flex; flex-direction: column; gap: 0.5rem; }

    .dispo {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.45rem 0;
      border-top: 1px solid rgba(10, 29, 53, 0.07);
      input[type='time'] { width: 7.5rem; padding: 0.5rem 0.7rem; }
      small { margin: 0; }
    }
    .jour {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      width: 8.5rem;
      margin: 0;
      cursor: pointer;
      input { width: auto; accent-color: var(--bleu-profond); }
    }

    .ajout { margin-bottom: 1.2rem; .btn { margin-top: 1rem; } }
    .acces {
      display: flex;
      flex-direction: column;
      margin-bottom: 1rem;
      padding: 0.9rem 1.1rem;
      border-radius: 14px;
      background: var(--bleu-diamant);
      font-size: 0.92rem;
      small { color: var(--texte-doux); }
    }
    .client { flex-wrap: wrap; }
    .solde {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      font-size: 0.85rem;
      button {
        width: 1.9rem;
        height: 1.9rem;
        border: 1.5px solid var(--champagne);
        border-radius: 50%;
        background: var(--blanc);
        font: 600 1rem var(--sans);
        color: var(--bleu-profond);
        cursor: pointer;
        &:hover:not(:disabled) { background: var(--bleu-diamant); }
        &:disabled { opacity: 0.4; cursor: not-allowed; }
      }
    }
    .outils { flex-basis: 100%; display: flex; gap: 1rem; padding-left: 3.4rem; }
    .lien {
      padding: 0;
      border: 0;
      background: none;
      font: 500 0.82rem var(--sans);
      color: var(--bleu-profond);
      text-decoration: underline;
      cursor: pointer;
      &.danger { color: var(--danger); }
    }

    @media (max-width: 900px) {
      .grille { grid-template-columns: 1fr; }
      .demande { flex-wrap: wrap; }
      .actions { flex-direction: row; }
    }
  `,
})
export class EspacePro {
  protected readonly data = inject(DataService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly jours = JOURS;
  protected readonly classe = classeStatut;
  protected readonly creneau = formaterCreneau;

  protected readonly clients = computed(() => this.data.utilisateurs().filter((u) => u.role === 'client'));
  protected readonly demandes = computed(() => this.data.demandes());
  protected readonly enAttente = computed(() => this.demandes().filter((d) => d.statut === 'en attente').length);
  protected readonly acceptees = computed(() => this.demandes().filter((d) => d.statut === 'acceptée').length);

  // Copie locale éditable des disponibilités ; chaque modification est enregistrée aussitôt.
  protected readonly dispos = this.data.disponibilites().map((d) => ({ ...d }));

  protected nouveauNom = '';
  protected nouveauSolde = 10;
  protected readonly cree = signal<Utilisateur | null>(null);

  protected readonly occupe = signal<string | null>(null);
  protected readonly erreur = signal('');

  protected readonly google = signal<{ configure: boolean; connecte: boolean } | null>(null);
  protected readonly retourGoogle = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('google'));

  constructor() {
    if (this.navigateur) void this.chargerStatutGoogle();
  }

  protected nomClient(d: Demande): string {
    return this.data.utilisateur(d.clientId)?.nom ?? 'Client inconnu';
  }

  protected soldeClient(d: Demande): number {
    return this.data.utilisateur(d.clientId)?.solde ?? 0;
  }

  protected sauverDispos(): void {
    this.data.majDisponibilites(this.dispos.map((d) => ({ ...d })));
  }

  protected ajouterClient(): void {
    const nom = this.nouveauNom.trim();
    if (!nom || this.nouveauSolde < 1) return;
    this.cree.set(this.data.ajouterClient(nom, Math.floor(this.nouveauSolde)));
    this.nouveauNom = '';
  }

  protected regenerer(c: Utilisateur): void {
    if (!confirm(`Générer un nouveau code pour ${c.nom} ? L'ancien ne fonctionnera plus.`)) return;
    this.data.regenererCode(c.id);
    this.cree.set(null);
  }

  protected supprimer(c: Utilisateur): void {
    if (!confirm(`Supprimer ${c.nom} ? Son espace, ses documents et ses demandes seront effacés.`)) return;
    this.data.supprimerClient(c.id);
    this.cree.set(null);
  }

  /** Crée la séance dans Google Agenda (si connecté), puis l'accepte et décompte une séance. */
  protected async accepter(d: Demande): Promise<void> {
    this.erreur.set('');
    this.occupe.set(d.id);
    try {
      if (this.google()?.connecte) {
        const r = await fetch('/api/google/evenement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ debut: d.debut, fin: d.fin, client: this.nomClient(d) }),
        });
        if (!r.ok) {
          this.erreur.set("La séance n'a pas pu être ajoutée à Google Agenda : la demande reste en attente.");
          return;
        }
      }
      if (!this.data.accepter(d.id)) this.erreur.set("Ce client n'a plus de séance disponible.");
    } catch {
      this.erreur.set('Erreur réseau : la demande reste en attente.');
    } finally {
      this.occupe.set(null);
    }
  }

  protected async deconnecterGoogle(): Promise<void> {
    await fetch('/api/google/deconnexion', { method: 'POST' });
    await this.chargerStatutGoogle();
  }

  private async chargerStatutGoogle(): Promise<void> {
    try {
      const r = await fetch('/api/google/statut');
      this.google.set(r.ok ? await r.json() : { configure: false, connecte: false });
    } catch {
      this.google.set({ configure: false, connecte: false });
    }
  }
}
