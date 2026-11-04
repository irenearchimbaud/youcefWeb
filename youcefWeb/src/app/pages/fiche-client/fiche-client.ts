import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { I18n, TrPipe } from '../../core/i18n';
import { DataService } from '../../core/data.service';
import { Document, TAILLE_MAX_DOCUMENT, TYPES_DOCUMENT, estVisualisable, formaterTaille } from '../../core/models';

@Component({
  selector: 'app-fiche-client',
  imports: [FormsModule, RouterLink, TrPipe],
  template: `
    @if (client(); as c) {
      <section class="bandeau">
        <div class="conteneur">
          <a class="retour" routerLink="/espace-pro">{{ '← Mes clients' | tr: '← My clients' }}</a>
          <span class="sur-titre">{{ 'Fiche client' | tr: 'Client file' }}</span>
          <h1>{{ c.nom }}</h1>
          <p class="acces">{{ c.email }}</p>
        </div>
      </section>

      <div class="conteneur grille">
        <section class="carte">
          <h2>{{ 'Séances' | tr: 'Sessions' }}</h2>
          <p class="solde"><strong>{{ c.solde }}</strong> {{ 'séance(s) restante(s)' | tr: 'session(s) remaining' }}</p>

          @if (etape() === 'repos') {
            <button type="button" class="btn secondaire petit" (click)="commencerModif(c.solde)">{{ 'Modifier le nombre de séances' | tr: 'Change the number of sessions' }}</button>
          } @else if (etape() === 'saisie') {
            <form (ngSubmit)="demanderConfirmation(c.solde)">
              <label for="nb">{{ 'Nouveau nombre de séances' | tr: 'New number of sessions' }}</label>
              <input id="nb" name="nb" type="number" min="0" max="500" step="1" [(ngModel)]="nouveauSolde" required />
              <div class="boutons">
                <button class="btn petit" type="submit" [disabled]="!valide() || nouveauSolde === c.solde">{{ 'Continuer' | tr: 'Continue' }}</button>
                <button class="btn secondaire petit" type="button" (click)="annuler()">{{ 'Annuler' | tr: 'Cancel' }}</button>
              </div>
            </form>
          } @else {
            <div class="confirmation" role="alertdialog" aria-labelledby="titre-confirm">
              <strong id="titre-confirm">{{ 'Confirmer la modification ?' | tr: 'Confirm the change?' }}</strong>
              <p>
                {{ 'Le solde de' | tr: 'The balance of sessions for' }} {{ c.nom }} {{ 'passera de' | tr: 'will change from' }} <strong>{{ c.solde }}</strong> {{ 'à' | tr: 'to' }} <strong>{{ nouveauSolde }}</strong> {{ 'séance(s)' | tr: 'session(s)' }}
                ({{ nouveauSolde - c.solde > 0 ? '+' : '' }}{{ nouveauSolde - c.solde }}).
              </p>
              <div class="boutons">
                <button class="btn petit" type="button" (click)="confirmer(c.id)">{{ 'Oui, modifier' | tr: 'Yes, change it' }}</button>
                <button class="btn secondaire petit" type="button" (click)="annuler()">{{ 'Non, annuler' | tr: 'No, cancel' }}</button>
              </div>
            </div>
          }
          @if (message()) {
            <p class="succes" role="status">{{ 'Nombre de séances mis à jour.' | tr: 'Number of sessions updated.' }}</p>
          }

          @if (nouveauCode()) {
            <div class="confirmation" role="status">
              <strong>{{ 'Nouveau code de première connexion' | tr: 'New first-login code' }}</strong>
              <p><code>{{ nouveauCode() }}</code></p>
              <small>{{ "À transmettre au client. Ce code ne sera plus jamais affiché : le client choisira un nouveau mot de passe à sa prochaine connexion." | tr: 'To be passed on to the client. This code will never be shown again: the client will choose a new password at their next sign-in.' }}</small>
            </div>
          }

          <div class="outils">
            <button type="button" class="lien" (click)="regenerer(c.id, c.nom)">{{ 'Nouveau code' | tr: 'New code' }}</button>
            <button type="button" class="lien danger" (click)="supprimerClient(c.id, c.nom)">{{ 'Supprimer le client' | tr: 'Delete client' }}</button>
          </div>
        </section>

        <section class="carte">
          <h2>{{ 'Documents' | tr: 'Documents' }}</h2>
          <form class="ajout" (ngSubmit)="deposer(c.id)">
            <label for="titre">{{ 'Titre du document' | tr: 'Document title' }}</label>
            <input id="titre" name="titre" [(ngModel)]="titre" [placeholder]="'Ex. Compte rendu – séance 3' | tr: 'E.g. Report – session 3'" />
            <label for="fichier">{{ 'Fichier' | tr: 'File' }}</label>
            <input id="fichier" name="fichier" type="file" [accept]="types" (change)="choisir($event)" />
            <small class="aide">{{ 'PDF, images, Word ou texte · 4 Mo maximum.' | tr: 'PDF, images, Word or text · 4 MB maximum.' }}</small>
            @if (erreur()) {
              <p class="erreur" role="alert">{{ texteErreur() }}</p>
            }
            <button class="btn petit" type="submit" [disabled]="!fichier || envoi()">{{ envoi() ? ('Envoi…' | tr: 'Uploading…') : ('Déposer le document' | tr: 'Upload document') }}</button>
          </form>

          @for (d of documents(); track d.id) {
            <div class="ligne">
              <div class="infos">
                <strong>{{ d.titre }}</strong>
                <small>{{ d.date }} · {{ d.fichier }} · {{ taille(d.taille, i18n.langue()) }}</small>
              </div>
              <div class="actions">
                @if (visualisable(d)) {
                  <button type="button" class="btn secondaire petit" (click)="voir(d)">{{ 'Voir' | tr: 'View' }}</button>
                }
                <button type="button" class="btn secondaire petit" (click)="telecharger(d)">{{ 'Télécharger' | tr: 'Download' }}</button>
                <button type="button" class="lien danger" (click)="supprimerDocument(d)">{{ 'Supprimer' | tr: 'Delete' }}</button>
              </div>
            </div>
          } @empty {
            <p class="vide">{{ 'Aucun document pour ce client.' | tr: 'No documents for this client.' }}</p>
          }
        </section>
      </div>
    } @else {
      <div class="conteneur introuvable">
        <p>{{ "Ce client n'existe pas (ou a été supprimé)." | tr: 'This client does not exist (or has been deleted).' }}</p>
        <a class="btn petit" routerLink="/espace-pro">{{ 'Retour à mes clients' | tr: 'Back to my clients' }}</a>
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

  protected readonly i18n = inject(I18n);
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
  /** Code de première connexion, affiché une seule fois puis oublié. */
  protected readonly nouveauCode = signal('');

  // Dépôt de document
  protected titre = '';
  protected fichier: File | null = null;
  protected readonly erreur = signal<'' | 'trop-gros' | 'stockage' | 'introuvable'>('');
  protected readonly texteErreur = computed(() => {
    switch (this.erreur()) {
      case 'trop-gros':
        return this.i18n.t('Ce fichier dépasse 4 Mo.', 'This file exceeds 4 MB.');
      case 'stockage':
        return this.i18n.t(
          "Le document n'a pas pu être enregistré (format non accepté ou fichier trop volumineux ?).",
          'The document could not be saved (unsupported format or file too large?).',
        );
      case 'introuvable':
        return this.i18n.t('Fichier introuvable.', 'File not found.');
      default:
        return '';
    }
  });
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

  protected async confirmer(id: string): Promise<void> {
    if (!this.valide()) return;
    try {
      await this.data.definirSolde(id, this.nouveauSolde);
      this.message.set('Nombre de séances mis à jour.');
    } catch {
      alert(this.i18n.t('La modification a échoué. Réessayez.', 'The change failed. Please try again.'));
    }
    this.etape.set('repos');
  }

  protected annuler(): void {
    this.etape.set('repos');
  }

  protected async regenerer(id: string, nom: string): Promise<void> {
    if (!confirm(this.i18n.t(`Générer un nouveau code pour ${nom} ? Son mot de passe actuel ne fonctionnera plus et il devra en choisir un nouveau.`, `Generate a new code for ${nom}? Their current password will stop working and they will have to choose a new one.`))) return;
    try {
      this.nouveauCode.set(await this.data.regenererCode(id));
    } catch {
      alert(this.i18n.t('Impossible de générer un nouveau code.', 'Could not generate a new code.'));
    }
  }

  protected async supprimerClient(id: string, nom: string): Promise<void> {
    if (!confirm(this.i18n.t(`Supprimer ${nom} ? Son compte et ses documents seront effacés définitivement.`, `Delete ${nom}? Their account and documents will be permanently erased.`))) return;
    try {
      await this.data.supprimerClient(id);
      void this.router.navigateByUrl('/espace-pro');
    } catch {
      alert(this.i18n.t('Suppression impossible.', 'Could not delete the client.'));
    }
  }

  protected choisir(e: Event): void {
    this.fichier = (e.target as HTMLInputElement).files?.[0] ?? null;
    this.erreur.set('');
    if (this.fichier && this.fichier.size > TAILLE_MAX_DOCUMENT) {
      this.erreur.set('trop-gros');
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
      this.erreur.set('stockage');
    } finally {
      this.envoi.set(false);
    }
  }

  protected async voir(d: Document): Promise<void> {
    if (!(await this.data.visualiser(d))) this.erreur.set('introuvable');
  }

  protected async telecharger(d: Document): Promise<void> {
    if (!(await this.data.telecharger(d))) this.erreur.set('introuvable');
  }

  protected async supprimerDocument(d: Document): Promise<void> {
    if (!confirm(this.i18n.t(`Supprimer « ${d.titre} » ? Le client n'y aura plus accès.`, `Delete “${d.titre}”? The client will no longer have access to it.`))) return;
    try {
      await this.data.supprimerDocument(d);
    } catch {
      alert(this.i18n.t('Suppression impossible.', 'Could not delete the document.'));
    }
  }
}
