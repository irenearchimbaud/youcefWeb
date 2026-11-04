import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-devis',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <section class="formulaire">
        @if (envoye()) {
          <div class="succes">
            <span class="sur-titre">Demande envoyée</span>
            <h1>Merci !</h1>
            <p class="intro">
              Youcef a bien reçu votre demande. Il vous répond par e-mail dans les meilleurs délais, puis crée votre
              espace personnel.
            </p>
            <a routerLink="/" class="btn">Retour à l'accueil</a>
          </div>
        } @else {
          <form (ngSubmit)="envoyer()">
            <span class="sur-titre">Demande de devis</span>
            <h1>Parlons de votre projet</h1>
            <p class="intro">Quelques informations suffisent : Youcef vous répond personnellement par e-mail.</p>

            <label for="nom">Nom et prénom</label>
            <input id="nom" name="nom" [(ngModel)]="nom" autocomplete="name" maxlength="100" required />

            <label for="email">E-mail</label>
            <input id="email" name="email" type="email" [(ngModel)]="email" autocomplete="email" maxlength="150" required />

            <label for="tel">Téléphone (facultatif)</label>
            <input id="tel" name="tel" type="tel" [(ngModel)]="telephone" autocomplete="tel" maxlength="30" />

            <label for="formule">Formule souhaitée</label>
            <select id="formule" name="formule" [(ngModel)]="formule">
              <option value="">Je ne sais pas encore</option>
              @for (f of formules; track f) {
                <option [value]="f">{{ f }}</option>
              }
            </select>

            <label for="message">Ce qui vous amène</label>
            <textarea id="message" name="message" rows="5" [(ngModel)]="message" maxlength="3000" required></textarea>

            <input class="piege" name="siteWeb" [(ngModel)]="siteWeb" tabindex="-1" autocomplete="off" aria-hidden="true" />

            @if (erreur()) {
              <p class="erreur" role="alert">{{ erreur() }}</p>
            }

            <button class="btn large" type="submit" [disabled]="enCours()">
              {{ enCours() ? 'Envoi…' : 'Envoyer ma demande' }}
            </button>
            <a routerLink="/" class="retour">← Retour à l'accueil</a>
          </form>
        }
      </section>
    </div>
  `,
  styles: `
    .page { display: grid; place-items: center; padding: 3rem 1.5rem; min-height: calc(100dvh - 4.5rem); }
    .formulaire { width: 100%; max-width: 520px; }
    h1 { font-size: 2.8rem; margin-bottom: 0.3rem; }
    .intro { color: var(--texte-doux); }
    input, select, textarea {
      display: block; width: 100%; box-sizing: border-box; margin-top: 0.3rem;
      padding: 0.7rem 0.9rem; border: 1px solid var(--champagne); border-radius: 10px;
      background: var(--blanc); font: 1rem var(--sans); color: inherit;
    }
    label { display: block; margin-top: 1.1rem; font-weight: 500; font-size: 0.9rem; }
    textarea { resize: vertical; }
    .piege { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
    .btn { margin-top: 1.6rem; }
    .erreur { color: var(--danger); margin: 0.9rem 0 0; font-size: 0.9rem; font-weight: 500; }
    .retour { display: inline-block; margin-top: 1.8rem; margin-left: 1rem; font-size: 0.88rem; color: var(--texte-doux); text-decoration: none; &:hover { color: var(--bleu-profond); } }
  `,
})
export class Devis {
  protected readonly formules = ['Accompagnement ciblé', 'Accompagnement approfondi', "Bootcamp à l'étranger"];

  protected nom = '';
  protected email = '';
  protected telephone = '';
  protected formule = inject(ActivatedRoute).snapshot.queryParamMap.get('formule') ?? '';
  protected message = '';
  protected siteWeb = '';

  protected readonly enCours = signal(false);
  protected readonly envoye = signal(false);
  protected readonly erreur = signal('');

  protected async envoyer(): Promise<void> {
    if (!this.nom.trim() || !this.email.trim() || !this.message.trim()) {
      this.erreur.set('Merci de renseigner votre nom, votre e-mail et votre message.');
      return;
    }
    this.erreur.set('');
    this.enCours.set(true);
    try {
      const r = await fetch('/api/devis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nom: this.nom,
          email: this.email,
          telephone: this.telephone,
          formule: this.formule,
          message: this.message,
          siteWeb: this.siteWeb,
        }),
      });
      if (r.ok) this.envoye.set(true);
      else this.erreur.set((await r.json().catch(() => null))?.erreur ?? "L'envoi a échoué. Merci de réessayer.");
    } catch {
      this.erreur.set("L'envoi a échoué. Vérifiez votre connexion et réessayez.");
    } finally {
      this.enCours.set(false);
    }
  }
}
