import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { I18n, TrPipe } from '../../core/i18n';
import { Bilingue, trouverFormation } from '../../core/formations';

@Component({
  selector: 'app-formation',
  imports: [RouterLink, TrPipe],
  template: `
    <main class="page">
      <div class="conteneur">
        <a routerLink="/" fragment="formations" class="retour">{{ '← Toutes les formations' | tr: '← All courses' }}</a>

        @if (formation(); as f) {
          <div class="grille">
            <section>
              <span class="sur-titre">{{ t(f.niveau) }}</span>
              <h1>{{ t(f.titre) }}</h1>
              <p class="chapeau">{{ t(f.resume) }}</p>
              <p>{{ t(f.description) }}</p>

              <h2>{{ 'Ce que vous allez apprendre' | tr: 'What you will learn' }}</h2>
              <ul class="objectifs">
                @for (o of f.objectifs; track $index) {
                  <li>{{ t(o) }}</li>
                }
              </ul>

              <h2>{{ 'Programme' | tr: 'Curriculum' }}</h2>
              <ol class="programme">
                @for (m of f.programme; track $index) {
                  <li>{{ t(m) }}</li>
                }
              </ol>
            </section>

            <aside class="carte achat">
              <ul>
                <li>{{ f.modules }} {{ 'modules' | tr: 'modules' }}</li>
                <li>{{ f.heures }} h {{ 'de vidéo' | tr: 'of video' }}</li>
                <li>{{ 'Accès à vie, à votre rythme' | tr: 'Lifetime access, at your own pace' }}</li>
              </ul>
              <p class="sur-devis">{{ 'Tarif sur devis.' | tr: 'Pricing on request.' }}</p>
              <a routerLink="/devis" class="btn large">
                {{ 'Demander un devis' | tr: 'Request a quote' }}
              </a>
              <small>{{ 'Formation fictive de démonstration.' | tr: 'Fictional demo course.' }}</small>
            </aside>
          </div>
        } @else {
          <h1>{{ 'Formation introuvable' | tr: 'Course not found' }}</h1>
          <a routerLink="/" fragment="formations" class="btn">{{ 'Voir les formations' | tr: 'See the courses' }}</a>
        }
      </div>
    </main>
  `,
  styles: `
    .page { padding: 3rem 0 5rem; }
    .retour { display: inline-block; margin-bottom: 2rem; color: var(--texte-doux); text-decoration: none; }
    .retour:hover { color: var(--bleu-profond); }
    .grille { display: grid; grid-template-columns: 1.6fr 1fr; gap: 3rem; align-items: start; }
    h1 { font-size: clamp(2.2rem, 5vw, 3.2rem); }
    h2 { font-size: 1.6rem; margin-top: 2.2rem; }
    .chapeau { font-size: 1.15rem; color: var(--texte-doux); }
    .objectifs, .programme { padding-left: 1.3rem; }
    .objectifs li, .programme li { padding: 0.35rem 0; }
    .achat { position: sticky; top: 6rem; display: grid; gap: 1rem; }
    .sur-devis { margin: 0; font-family: var(--serif); font-size: 1.8rem; color: var(--bleu-profond); }
    .achat ul { list-style: none; margin: 0; padding: 0; }
    .achat li { padding: 0.5rem 0; border-top: 1px solid rgba(10, 29, 53, 0.08); font-size: 0.95rem; }
    .achat small { color: var(--texte-doux); text-align: center; }
    @media (max-width: 860px) {
      .grille { grid-template-columns: 1fr; }
      .achat { position: static; }
    }
  `,
})
export class Formation {
  private readonly i18n = inject(I18n);
  private readonly slug = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('slug'))), { initialValue: null });
  protected readonly formation = computed(() => trouverFormation(this.slug()));

  protected t(paire: Bilingue): string {
    return this.i18n.t(paire[0], paire[1]);
  }
}
