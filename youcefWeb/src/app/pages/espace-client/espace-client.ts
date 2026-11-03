import { Component, DestroyRef, PLATFORM_ID, computed, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { AuthService } from '../../core/auth.service';
import { CALENDLY_URL } from '../../core/config';
import { DataService } from '../../core/data.service';

@Component({
  selector: 'app-espace-client',
  template: `
    <section class="bandeau">
      <div class="conteneur">
        <span class="sur-titre">Mon espace</span>
        <h1>Bonjour {{ prenom() }}</h1>
        <div class="stats">
          <div><strong>{{ utilisateur().solde }}</strong><span>séance(s) restante(s)</span></div>
          <div><strong>{{ reservations().length }}</strong><span>séance(s) réservée(s)</span></div>
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
          @for (r of reservations(); track r.id) {
            <div class="ligne">
              <div class="infos">
                <strong>Séance réservée le {{ r.date }}</strong>
                <small>Date et lien de visio dans votre e-mail de confirmation</small>
              </div>
              <span class="badge acceptee">confirmée</span>
            </div>
          } @empty {
            <p class="vide">Vous n'avez pas encore réservé de séance.</p>
          }
        </section>
      </div>

      <aside class="carte demande">
        <h2>Réserver une séance</h2>
        @if (utilisateur().solde < 1) {
          <p class="aide">Votre solde de séances est épuisé. Contactez Youcef pour en obtenir de nouvelles.</p>
        } @else {
          <p class="aide">
            Choisissez un créneau dans l'agenda de Youcef. La séance est ajoutée à son Google Agenda
            et une confirmation vous est envoyée par e-mail.
          </p>
          @if (calendly(); as url) {
            <iframe class="calendly" [src]="url" title="Réservation d'une séance" loading="lazy"></iframe>
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
    .retour { margin: 1rem 0 0; font-weight: 600; color: var(--succes); font-size: 0.92rem; }

    .calendly { width: 100%; height: 680px; border: 0; border-radius: 14px; }

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
  private readonly sanitizer = inject(DomSanitizer);

  protected readonly utilisateur = computed(() => this.auth.utilisateur()!);
  protected readonly prenom = computed(() => this.utilisateur().nom.split(' ')[0]);
  protected readonly documents = computed(() => this.data.documentsDe(this.utilisateur().id));
  protected readonly reservations = computed(() => this.data.reservationsDe(this.utilisateur().id));
  protected readonly retour = signal('');

  /** Widget Calendly (navigateur uniquement), pré-rempli avec le nom du client. */
  protected readonly calendly = computed<SafeResourceUrl | null>(() => {
    if (!this.navigateur) return null;
    const params = new URLSearchParams({
      embed_domain: location.hostname,
      embed_type: 'Inline',
      hide_gdpr_banner: '1',
      name: this.utilisateur().nom,
    });
    return this.sanitizer.bypassSecurityTrustResourceUrl(`${CALENDLY_URL}?${params}`);
  });

  constructor() {
    if (!this.navigateur) return;
    // Calendly prévient la page parente une fois la réservation faite : on décompte alors une séance.
    const ecouteur = (e: MessageEvent) => {
      if (e.origin !== 'https://calendly.com' || e.data?.event !== 'calendly.event_scheduled') return;
      this.data.enregistrerReservation(this.utilisateur().id);
      this.retour.set("Séance réservée : elle apparaît dans l'agenda de Youcef, et un e-mail de confirmation vous est envoyé.");
    };
    window.addEventListener('message', ecouteur);
    inject(DestroyRef).onDestroy(() => window.removeEventListener('message', ecouteur));
  }
}
