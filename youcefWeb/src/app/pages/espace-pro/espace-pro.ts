import { Component, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DataService } from '../../core/data.service';
import { Rdv, Utilisateur, chargerRdv, formaterCreneau } from '../../core/models';

@Component({
  selector: 'app-espace-pro',
  imports: [FormsModule, RouterLink],
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Espace professionnel</span>
        <h1>Bonjour Youcef</h1>
        <div class="stats">
          <div><strong>{{ rdv().length }}</strong><span>rendez-vous à venir</span></div>
          <div><strong>{{ clients().length }}</strong><span>clients</span></div>
        </div>
      </div>
    </section>

    <div class="conteneur grille">
      <div class="colonne">
        <section class="carte">
          <h2>Prochains rendez-vous</h2>
          <p class="aide">
            Les séances réservées par vos clients via Calendly apparaissent ici automatiquement.
            Vos disponibilités se règlent dans Calendly.
          </p>
          @if (configure() === false) {
            <p class="vide">
              Calendly n'est pas encore relié au serveur : définissez la variable <code>CALENDLY_TOKEN</code>.
            </p>
          } @else {
            @for (r of rdv(); track r.id) {
              <article class="demande">
                <span class="avatar">{{ nomClient(r).charAt(0) }}</span>
                <div class="corps">
                  <strong>{{ nomClient(r) }}</strong>
                  <small>{{ creneau(r.debut, r.fin) }}</small>
                </div>
                @if (r.lien) {
                  <a class="btn petit" [href]="r.lien" target="_blank" rel="noopener">Rejoindre</a>
                }
              </article>
            } @empty {
              <p class="vide">{{ erreurAgenda() ? "Les rendez-vous n'ont pas pu être chargés." : 'Aucun rendez-vous à venir.' }}</p>
            }
          }
        </section>
      </div>

      <div class="colonne">
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
              <span class="solde"><strong>{{ c.solde }}</strong> séance(s) · {{ data.documentsDe(c.id).length }} doc(s)</span>
              <div class="outils">
                <a class="btn petit" [routerLink]="['/espace-pro/client', c.id]">Ouvrir la fiche</a>
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
    .solde { font-size: 0.85rem; color: var(--texte-doux); strong { color: var(--bleu-profond); } }
    .outils { flex-basis: 100%; display: flex; align-items: center; gap: 1rem; padding-left: 3.4rem; }
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
  protected readonly configure = signal<boolean | null>(null);
  protected readonly creneau = formaterCreneau;
  protected readonly erreurAgenda = signal(false);

  protected nouveauNom = '';
  protected nouveauSolde = 10;
  protected readonly cree = signal<Utilisateur | null>(null);

  constructor() {
    if (this.navigateur) void this.chargerRdv();
  }

  protected nomClient(r: Rdv): string {
    return (r.clientId && this.data.utilisateur(r.clientId)?.nom) || r.invite;
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

  private async chargerRdv(): Promise<void> {
    try {
      const r = await chargerRdv();
      this.configure.set(r.configure);
      this.rdv.set(r.rdv);
      this.erreurAgenda.set(false);
    } catch {
      this.erreurAgenda.set(true);
    }
  }
}
