import { Component, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { I18n, TrPipe } from '../../core/i18n';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { Rdv, Utilisateur, chargerRdv, formaterCreneau } from '../../core/models';

@Component({
  selector: 'app-espace-pro',
  imports: [FormsModule, RouterLink, TrPipe],
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">{{ 'Espace professionnel' | tr: 'Professional area' }}</span>
        <h1>{{ 'Bonjour Youcef' | tr: 'Hello Youcef' }}</h1>
        <div class="stats">
          <div><strong>{{ rdv().length }}</strong><span>{{ 'rendez-vous à venir' | tr: 'upcoming appointments' }}</span></div>
          <div><strong>{{ clients().length }}</strong><span>{{ 'clients' | tr: 'clients' }}</span></div>
        </div>
      </div>
    </section>

    <div class="conteneur grille">
      <div class="colonne">
        <section class="carte">
          <h2>{{ 'Prochains rendez-vous' | tr: 'Upcoming appointments' }}</h2>
          <p class="aide">
            {{ 'Les séances réservées par vos clients via Calendly apparaissent ici automatiquement. Vos disponibilités se règlent dans Calendly.' | tr: 'Sessions booked by your clients through Calendly appear here automatically. You manage your availability in Calendly.' }}
          </p>
          @if (configure() === false) {
            <p class="vide">
              {{ "Calendly n'est pas encore relié au serveur : définissez la variable" | tr: 'Calendly is not yet connected to the server: set the variable' }} <code>CALENDLY_TOKEN</code>.
            </p>
          } @else {
            @for (r of rdv(); track r.id) {
              <article class="demande">
                <span class="avatar">{{ nomClient(r).charAt(0) }}</span>
                <div class="corps">
                  <strong>{{ nomClient(r) }}</strong>
                  <small>{{ creneau(r.debut, r.fin, i18n.locale()) }}</small>
                </div>
                @if (r.lien) {
                  <a class="btn petit" [href]="r.lien" target="_blank" rel="noopener">{{ 'Rejoindre' | tr: 'Join' }}</a>
                }
              </article>
            } @empty {
              <p class="vide">{{ erreurAgenda() ? ("Les rendez-vous n'ont pas pu être chargés." | tr: 'Appointments could not be loaded.') : ('Aucun rendez-vous à venir.' | tr: 'No upcoming appointments.') }}</p>
            }
          }
        </section>
      </div>

      <div class="colonne">
        <section class="carte">
          <h2>{{ 'Mes clients' | tr: 'My clients' }}</h2>
          <form class="ajout" (ngSubmit)="ajouterClient()">
            <label for="nom">{{ 'Nouveau client' | tr: 'New client' }}</label>
            <input id="nom" name="nom" [(ngModel)]="nouveauNom" [placeholder]="'Prénom Nom' | tr: 'First name Last name'" required />
            <label for="email">{{ 'E-mail du client' | tr: 'Client email' }}</label>
            <input id="email" name="email" type="email" [(ngModel)]="nouvelEmail" placeholder="prenom@exemple.fr" autocomplete="off" required />
            <label for="solde">{{ 'Séances achetées' | tr: 'Sessions purchased' }}</label>
            <input id="solde" name="solde" type="number" min="1" max="200" [(ngModel)]="nouveauSolde" required />
            <button class="btn petit" type="submit" [disabled]="!nouveauNom.trim() || !nouvelEmail.trim() || nouveauSolde < 1 || envoi()">{{ "Créer l'espace" | tr: 'Create client area' }}</button>
            @if (erreurAjout()) {
              <p class="erreur" role="alert">{{ erreurAjout() }}</p>
            }
          </form>

          @if (cree(); as c) {
            <div class="acces" role="status">
              <strong>{{ c.nouveau ? ('Espace créé pour' | tr: 'Client area created for') : ('Nouveau code pour' | tr: 'New code for') }} {{ c.nom }}</strong>
              <span>{{ 'E-mail :' | tr: 'Email:' }} <code>{{ c.email }}</code></span>
              <span>{{ 'Code de première connexion :' | tr: 'First-login code:' }} <code>{{ c.code }}</code></span>
              <small>{{ "À transmettre au client. Ce code ne sera plus jamais affiché : le client choisira son propre mot de passe dès sa première connexion, que vous ne connaîtrez pas." | tr: 'To be passed on to the client. This code will never be shown again: the client will choose their own password at first sign-in, which you will not know.' }}</small>
            </div>
          }

          @for (c of clients(); track c.id) {
            <article class="client">
              <span class="avatar">{{ c.nom.charAt(0) }}</span>
              <div class="corps">
                <strong>{{ c.nom }}</strong>
                <small>{{ c.email }}</small>
              </div>
              <span class="solde"><strong>{{ c.solde }}</strong> {{ 'séance(s)' | tr: 'session(s)' }} · {{ data.documentsDe(c.id).length }} {{ 'doc(s)' | tr: 'doc(s)' }}</span>
              <div class="outils">
                <a class="btn petit" [routerLink]="['/espace-pro/client', c.id]">{{ 'Ouvrir la fiche' | tr: 'Open client file' }}</a>
                <button type="button" class="lien" (click)="regenerer(c)">{{ 'Nouveau code' | tr: 'New code' }}</button>
                <button type="button" class="lien danger" (click)="supprimer(c)">{{ 'Supprimer' | tr: 'Delete' }}</button>
              </div>
            </article>
          } @empty {
            <p class="vide">{{ 'Aucun client pour le moment.' | tr: 'No clients yet.' }}</p>
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
  protected readonly i18n = inject(I18n);
  private readonly auth = inject(AuthService);
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  protected readonly clients = this.data.clients;
  protected readonly rdv = signal<Rdv[]>([]);
  protected readonly configure = signal<boolean | null>(null);
  protected readonly creneau = formaterCreneau;
  protected readonly erreurAgenda = signal(false);

  protected nouveauNom = '';
  protected nouvelEmail = '';
  protected nouveauSolde = 10;
  protected readonly envoi = signal(false);
  protected readonly erreurAjout = signal('');
  /** Code de première connexion, affiché une seule fois puis oublié. */
  protected readonly cree = signal<{ nom: string; email: string; code: string; nouveau: boolean } | null>(null);

  constructor() {
    if (this.navigateur) void this.chargerRdv();
  }

  protected nomClient(r: Rdv): string {
    return (r.clientId && this.data.utilisateur(r.clientId)?.nom) || r.invite;
  }

  protected async ajouterClient(): Promise<void> {
    const nom = this.nouveauNom.trim();
    const email = this.nouvelEmail.trim();
    if (!nom || !email || this.nouveauSolde < 1 || this.envoi()) return;
    this.envoi.set(true);
    this.erreurAjout.set('');
    try {
      const { client, code } = await this.data.ajouterClient(nom, email, Math.floor(this.nouveauSolde));
      this.cree.set({ nom: client.nom, email: client.email, code, nouveau: true });
      this.nouveauNom = '';
      this.nouvelEmail = '';
    } catch (e) {
      this.erreurAjout.set((e as Error).message || this.i18n.t('Création impossible.', 'Could not create the account.'));
    } finally {
      this.envoi.set(false);
    }
  }

  protected async regenerer(c: Utilisateur): Promise<void> {
    if (!confirm(this.i18n.t(`Générer un nouveau code pour ${c.nom} ? Son mot de passe actuel ne fonctionnera plus et il devra en choisir un nouveau.`, `Generate a new code for ${c.nom}? Their current password will stop working and they will have to choose a new one.`))) return;
    try {
      this.cree.set({ nom: c.nom, email: c.email, code: await this.data.regenererCode(c.id), nouveau: false });
    } catch {
      alert(this.i18n.t('Impossible de générer un nouveau code.', 'Could not generate a new code.'));
    }
  }

  protected async supprimer(c: Utilisateur): Promise<void> {
    if (!confirm(this.i18n.t(`Supprimer ${c.nom} ? Son compte et ses documents seront effacés définitivement.`, `Delete ${c.nom}? Their account and documents will be permanently erased.`))) return;
    try {
      await this.data.supprimerClient(c.id);
      this.cree.set(null);
    } catch {
      alert(this.i18n.t('Suppression impossible.', 'Could not delete the client.'));
    }
  }

  private async chargerRdv(): Promise<void> {
    try {
      const r = await chargerRdv(await this.auth.jeton());
      this.configure.set(r.configure);
      this.rdv.set(r.rdv);
      this.erreurAgenda.set(false);
    } catch {
      this.erreurAgenda.set(true);
    }
  }
}
