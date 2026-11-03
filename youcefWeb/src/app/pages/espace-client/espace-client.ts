import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DataService } from '../../core/data.service';
import { classeStatut } from '../../core/models';

@Component({
  selector: 'app-espace-client',
  imports: [FormsModule],
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Mon espace</span>
        <h1>Bonjour {{ prenom() }}</h1>
        <div class="stats">
          <div><strong>{{ documents().length }}</strong><span>documents</span></div>
          <div><strong>{{ demandes().length }}</strong><span>demandes envoyées</span></div>
          <div><strong>{{ acceptees() }}</strong><span>acceptées</span></div>
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
          <h2>Mes demandes</h2>
          @for (d of demandes(); track d.id) {
            <div class="ligne">
              <div class="infos">
                <strong>{{ d.offre }}</strong>
                <small>Envoyée le {{ d.date }}</small>
              </div>
              <span class="badge" [class]="'badge ' + classe(d.statut)">{{ d.statut }}</span>
            </div>
          } @empty {
            <p class="vide">Vous n'avez pas encore fait de demande.</p>
          }
        </section>
      </div>

      <aside class="carte demande">
        <h2>Prendre rendez-vous</h2>
        <p class="aide">Dites-moi ce qui vous amène, je reviens vers vous pour fixer un créneau en visio.</p>
        <form (ngSubmit)="envoyer()">
          <label for="offre">Accompagnement</label>
          <select id="offre" name="offre" [(ngModel)]="offre">
            @for (o of offres; track o) {
              <option>{{ o }}</option>
            }
          </select>
          <label for="msg">Ce qui m'amène</label>
          <textarea id="msg" name="msg" rows="5" [(ngModel)]="message" required
            placeholder="Quelques mots sur votre situation…"></textarea>
          <button class="btn large" type="submit" [disabled]="!message.trim() || envoi()">
            {{ envoi() ? 'Envoi…' : 'Envoyer ma demande' }}
          </button>
          @if (retour()) {
            <p class="retour" role="status">{{ retour() }}</p>
          }
        </form>
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
    .retour { margin: 1rem 0 0; font-weight: 600; color: var(--succes); font-size: 0.92rem; }

    @media (max-width: 900px) {
      .grille { grid-template-columns: 1fr; }
      .demande { position: static; }
    }
  `,
})
export class EspaceClient {
  private readonly auth = inject(AuthService);
  private readonly data = inject(DataService);

  protected readonly utilisateur = computed(() => this.auth.utilisateur()!);
  protected readonly prenom = computed(() => this.utilisateur().nom.split(' ')[0]);
  protected readonly documents = computed(() => this.data.documentsDe(this.utilisateur().id));
  protected readonly demandes = computed(() => this.data.demandesDe(this.utilisateur().id));
  protected readonly acceptees = computed(() => this.demandes().filter((d) => d.statut === 'acceptée').length);
  protected readonly classe = classeStatut;

  protected readonly offres = [
    'Accompagnement ciblé (3 mois)',
    'Accompagnement approfondi (6 mois)',
    'Bootcamp à l\'étranger (1 semaine)',
  ];
  protected offre = this.offres[0];
  protected message = '';

  protected readonly envoi = signal(false);
  protected readonly retour = signal('');

  protected async envoyer(): Promise<void> {
    const message = this.message.trim();
    if (!message) return;
    this.envoi.set(true);
    this.retour.set('');
    try {
      const reponse = await fetch('/api/demandes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: this.utilisateur().nom, offre: this.offre, message }),
      });
      if (!reponse.ok) throw new Error(String(reponse.status));
      this.data.ajouterDemande(this.utilisateur().id, this.offre, message);
      this.message = '';
      this.retour.set('Votre demande a bien été envoyée à Youcef.');
    } catch {
      this.retour.set("L'envoi a échoué, merci de réessayer dans un instant.");
    } finally {
      this.envoi.set(false);
    }
  }
}
