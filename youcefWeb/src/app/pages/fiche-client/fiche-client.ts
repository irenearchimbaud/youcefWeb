import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../core/data.service';
import { Document, TAILLE_MAX_DOCUMENT, TYPES_DOCUMENT, estVisualisable, formaterTaille } from '../../core/models';

@Component({
  selector: 'app-fiche-client',
  imports: [FormsModule, RouterLink],
  template: `
    @if (client(); as c) {
      <section class="bandeau">
        <div class="conteneur">
          <a class="retour" routerLink="/espace-pro">← Mes clients</a>
          <span class="sur-titre">Fiche client</span>
          <h1>{{ c.nom }}</h1>
          <p class="acces">Identifiant : <code>{{ c.identifiant }}</code> · Code d'accès : <code>{{ c.code }}</code></p>
        </div>
      </section>

      <div class="conteneur grille">
        <section class="carte">
          <h2>Séances</h2>
          <p class="solde"><strong>{{ c.solde }}</strong> séance(s) restante(s)</p>

          @if (etape() === 'repos') {
            <button type="button" class="btn secondaire petit" (click)="commencerModif(c.solde)">Modifier le nombre de séances</button>
          } @else if (etape() === 'saisie') {
            <form (ngSubmit)="demanderConfirmation(c.solde)">
              <label for="nb">Nouveau nombre de séances</label>
              <input id="nb" name="nb" type="number" min="0" max="500" step="1" [(ngModel)]="nouveauSolde" required />
              <div class="boutons">
                <button class="btn petit" type="submit" [disabled]="!valide() || nouveauSolde === c.solde">Continuer</button>
                <button class="btn secondaire petit" type="button" (click)="annuler()">Annuler</button>
              </div>
            </form>
          } @else {
            <div class="confirmation" role="alertdialog" aria-labelledby="titre-confirm">
              <strong id="titre-confirm">Confirmer la modification ?</strong>
              <p>
                Le solde de {{ c.nom }} passera de <strong>{{ c.solde }}</strong> à <strong>{{ nouveauSolde }}</strong> séance(s)
                ({{ nouveauSolde - c.solde > 0 ? '+' : '' }}{{ nouveauSolde - c.solde }}).
              </p>
              <div class="boutons">
                <button class="btn petit" type="button" (click)="confirmer(c.id)">Oui, modifier</button>
                <button class="btn secondaire petit" type="button" (click)="annuler()">Non, annuler</button>
              </div>
            </div>
          }
          @if (message()) {
            <p class="succes" role="status">{{ message() }}</p>
          }

          <div class="outils">
            <button type="button" class="lien" (click)="regenerer(c.id, c.nom)">Nouveau code</button>
            <button type="button" class="lien danger" (click)="supprimerClient(c.id, c.nom)">Supprimer le client</button>
          </div>
        </section>

        <section class="carte">
          <h2>Documents</h2>
          <form class="ajout" (ngSubmit)="deposer(c.id)">
            <label for="titre">Titre du document</label>
            <input id="titre" name="titre" [(ngModel)]="titre" placeholder="Ex. Compte rendu – séance 3" />
            <label for="fichier">Fichier</label>
            <input id="fichier" name="fichier" type="file" [accept]="types" (change)="choisir($event)" />
            <small class="aide">PDF, images, Word ou texte · 10 Mo maximum.</small>
            @if (erreur()) {
              <p class="erreur" role="alert">{{ erreur() }}</p>
            }
            <button class="btn petit" type="submit" [disabled]="!fichier || envoi()">{{ envoi() ? 'Envoi…' : 'Déposer le document' }}</button>
          </form>

          @for (d of documents(); track d.id) {
            <div class="ligne">
              <div class="infos">
                <strong>{{ d.titre }}</strong>
                <small>{{ d.date }} · {{ d.fichier }} · {{ taille(d.taille) }}</small>
              </div>
              <div class="actions">
                @if (visualisable(d)) {
                  <button type="button" class="btn secondaire petit" (click)="voir(d)">Voir</button>
                }
                <button type="button" class="btn secondaire petit" (click)="telecharger(d)">Télécharger</button>
                <button type="button" class="lien danger" (click)="supprimerDocument(d)">Supprimer</button>
              </div>
            </div>
          } @empty {
            <p class="vide">Aucun document pour ce client.</p>
          }
        </section>
      </div>
    } @else {
      <div class="conteneur introuvable">
        <p>Ce client n'existe pas (ou a été supprimé).</p>
        <a class="btn petit" routerLink="/espace-pro">Retour à mes clients</a>
      </div>
    }
  `,
  styles: `
    .bandeau {
      padding: 3rem 0 4.5rem;
      background: linear-gradient(135deg, var(--bleu-profond), var(--bleu-nuit));
      color: var(--ivoire-clair);
      h1 { color: var(--ivoire-clair); font-size: clamp(2.4rem, 5vw, 3.6rem); margin-bottom: 0.6rem; }
    }
    .retour { display: inline-block; margin-bottom: 1.2rem; color: var(--bleu-diamant); font-size: 0.9rem; }
    .acces { margin: 0; opacity: 0.85; font-size: 0.92rem; }
    .acces code { background: rgba(250, 246, 240, 0.12); }
    code { padding: 0.1rem 0.4rem; border-radius: 6px; background: var(--ivoire-clair); font-size: 0.85em; letter-spacing: 0.04em; }
    .grille {
      display: grid;
      grid-template-columns: 1fr 1.4fr;
      gap: 1.6rem;
      align-items: start;
      margin-top: -2.2rem;
      padding-bottom: 4rem;
    }
    h2 { font-size: 1.9rem; margin-bottom: 1rem; }
    .solde { margin: 0 0 1rem; color: var(--texte-doux); strong { font: 600 2.4rem var(--serif); color: var(--bleu-profond); } }
    .boutons { display: flex; gap: 0.6rem; margin-top: 1rem; flex-wrap: wrap; }
    .confirmation {
      padding: 1rem 1.1rem;
      border: 1.5px solid var(--danger);
      border-radius: 14px;
      background: #fdf3f1;
      p { margin: 0.4rem 0 0; }
    }
    .succes { color: var(--succes); font-weight: 600; font-size: 0.92rem; margin: 0.8rem 0 0; }
    .erreur { color: var(--danger); font-size: 0.9rem; font-weight: 500; margin: 0.6rem 0 0; }
    .aide { color: var(--texte-doux); }
    .vide { color: var(--texte-doux); margin: 0; }
    .outils { display: flex; gap: 1rem; margin-top: 1.4rem; padding-top: 1rem; border-top: 1px solid rgba(10, 29, 53, 0.07); }
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
    .ajout { margin-bottom: 1.4rem; .btn { margin-top: 1rem; } }
    .ligne {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 0.9rem 0;
      border-top: 1px solid rgba(10, 29, 53, 0.07);
    }
    .infos { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.35; overflow-wrap: anywhere; small { color: var(--texte-doux); } }
    .actions { display: flex; align-items: center; gap: 0.5rem; flex-wrap: wrap; justify-content: flex-end; }
    .introuvable { padding: 4rem 0; }
    @media (max-width: 900px) {
      .grille { grid-template-columns: 1fr; }
      .ligne { flex-wrap: wrap; }
    }
  `,
})
export class FicheClient {
  /** Paramètre de route :id (withComponentInputBinding). */
  readonly id = input.required<string>();

  private readonly data = inject(DataService);
  private readonly router = inject(Router);

  protected readonly client = computed(() => {
    const c = this.data.utilisateur(this.id());
    return c?.role === 'client' ? c : undefined;
  });
  protected readonly documents = computed(() => this.data.documentsDe(this.id()));

  protected readonly types = TYPES_DOCUMENT;
  protected readonly taille = formaterTaille;
  protected readonly visualisable = (d: Document) => estVisualisable(d.type);

  // Modification du solde en trois temps : repos → saisie → confirmation.
  protected readonly etape = signal<'repos' | 'saisie' | 'confirmation'>('repos');
  protected nouveauSolde = 0;
  protected readonly message = signal('');

  // Dépôt de document
  protected titre = '';
  protected fichier: File | null = null;
  protected readonly erreur = signal('');
  protected readonly envoi = signal(false);

  protected valide(): boolean {
    return Number.isInteger(this.nouveauSolde) && this.nouveauSolde >= 0 && this.nouveauSolde <= 500;
  }

  protected commencerModif(actuel: number): void {
    this.nouveauSolde = actuel;
    this.message.set('');
    this.etape.set('saisie');
  }

  protected demanderConfirmation(actuel: number): void {
    if (!this.valide() || this.nouveauSolde === actuel) return;
    this.etape.set('confirmation');
  }

  protected confirmer(id: string): void {
    if (!this.valide()) return;
    this.data.definirSolde(id, this.nouveauSolde);
    this.etape.set('repos');
    this.message.set('Nombre de séances mis à jour.');
  }

  protected annuler(): void {
    this.etape.set('repos');
  }

  protected regenerer(id: string, nom: string): void {
    if (!confirm(`Générer un nouveau code pour ${nom} ? L'ancien ne fonctionnera plus.`)) return;
    this.data.regenererCode(id);
  }

  protected supprimerClient(id: string, nom: string): void {
    if (!confirm(`Supprimer ${nom} ? Son espace et ses documents seront effacés.`)) return;
    this.data.supprimerClient(id);
    void this.router.navigateByUrl('/espace-pro');
  }

  protected choisir(e: Event): void {
    this.fichier = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.erreur.set('');
    if (this.fichier && this.fichier.size > TAILLE_MAX_DOCUMENT) {
      this.erreur.set('Ce fichier dépasse 10 Mo.');
      this.fichier = null;
    }
  }

  protected async deposer(clientId: string): Promise<void> {
    if (!this.fichier) return;
    this.envoi.set(true);
    try {
      await this.data.ajouterDocument(clientId, this.titre, this.fichier);
      this.titre = '';
      this.fichier = null;
      (document.getElementById('fichier') as HTMLInputElement).value = '';
      this.erreur.set('');
    } catch {
      this.erreur.set("Le document n'a pas pu être enregistré (espace de stockage insuffisant ?).");
    } finally {
      this.envoi.set(false);
    }
  }

  protected async voir(d: Document): Promise<void> {
    if (!(await this.data.visualiser(d))) this.erreur.set('Fichier introuvable.');
  }

  protected async telecharger(d: Document): Promise<void> {
    if (!(await this.data.telecharger(d))) this.erreur.set('Fichier introuvable.');
  }

  protected async supprimerDocument(d: Document): Promise<void> {
    if (!confirm(`Supprimer « ${d.titre} » ? Le client n'y aura plus accès.`)) return;
    await this.data.supprimerDocument(d.id);
  }
}
