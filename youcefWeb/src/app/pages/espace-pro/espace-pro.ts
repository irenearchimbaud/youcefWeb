import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Utilisateur } from '../../core/models';

interface Rdv { id: string; titre: string; debut: string; fin: string; lien?: string; visio?: string }

@Component({
  selector: 'app-espace-pro',
  imports: [FormsModule],
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Espace professionnel</span>
        <h1>Bonjour Youcef</h1>
        <div class="stats">
          <div><strong>{{ rdv().length }}</strong><span>rendez-vous à venir</span></div>
          <div><strong>{{ data.reservations().length }}</strong><span>séances réservées</span></div>
          <div><strong>{{ clients().length }}</strong><span>clients</span></div>
        </div>
      </div>
    </section>

    <div class="conteneur grille">
      <div class="colonne">
        <section class="carte">
          <h2>Prochains rendez-vous</h2>
          <p class="aide">
            Les séances réservées par vos clients via Calendly arrivent directement dans votre Google Agenda.
            Vos disponibilités se règlent dans Calendly.
          </p>
          @if (google()?.connecte) {
            @for (r of rdv(); track r.id) {
              <article class="demande">
                <span class="avatar">{{ r.titre.charAt(0) }}</span>
                <div class="corps">
                  <strong>{{ r.titre }}</strong>
                  <small>{{ horaire(r) }}</small>
                </div>
                <div class="actions">
                  @if (r.visio) {
                    <a class="btn petit" [href]="r.visio" target="_blank" rel="noopener">Visio</a>
                  }
                  @if (r.lien) {
                    <a class="btn secondaire petit" [href]="r.lien" target="_blank" rel="noopener">Agenda</a>
                  }
                </div>
              </article>
            } @empty {
              <p class="vide">Aucun rendez-vous à venir.</p>
            }
            @if (erreurAgenda()) {
              <p class="erreur" role="alert">L'agenda n'a pas pu être lu pour le moment.</p>
            }
          } @else {
            <p class="vide">Connectez votre Google Agenda pour afficher vos rendez-vous ici.</p>
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
              Connecté : vos prochains rendez-vous (dont ceux réservés via Calendly) s'affichent ci-contre.
            </p>
            <button class="btn secondaire petit" (click)="deconnecterGoogle()">Déconnecter</button>
          } @else {
            <p class="aide">
              Connectez votre agenda pour afficher vos rendez-vous dans cet espace. Pour que Calendly y ajoute les séances, reliez aussi ce même agenda dans Calendly (Intégrations).
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

  protected readonly clients = computed(() => this.data.utilisateurs().filter((u) => u.role === 'client'));
  protected readonly rdv = signal<Rdv[]>([]);
  protected readonly erreurAgenda = signal(false);

  protected nouveauNom = '';
  protected nouveauSolde = 10;
  protected readonly cree = signal<Utilisateur | null>(null);

  protected readonly google = signal<{ configure: boolean; connecte: boolean } | null>(null);
  protected readonly retourGoogle = signal(inject(ActivatedRoute).snapshot.queryParamMap.get('google'));

  constructor() {
    if (this.navigateur) void this.chargerStatutGoogle();
  }

  protected horaire(r: Rdv): string {
    const jour = new Date(r.debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
    const h = (iso: string) => new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
    return `${jour}, ${h(r.debut)} – ${h(r.fin)}`;
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
    await this.chargerRdv();
  }

  private async chargerRdv(): Promise<void> {
    this.erreurAgenda.set(false);
    this.rdv.set([]);
    if (!this.google()?.connecte) return;
    try {
      const r = await fetch('/api/google/rdv');
      if (!r.ok) throw new Error(String(r.status));
      this.rdv.set((await r.json()).rdv);
    } catch {
      this.erreurAgenda.set(true);
    }
  }
}
