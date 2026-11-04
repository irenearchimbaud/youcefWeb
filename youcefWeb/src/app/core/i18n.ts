import { Injectable, Pipe, PipeTransform, PLATFORM_ID, computed, effect, inject, signal } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

export type Langue = 'fr' | 'en';

const CLE = 'youcef-langue';

/** Langue d'affichage du site (français par défaut, choix mémorisé dans le navigateur). */
@Injectable({ providedIn: 'root' })
export class I18n {
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly doc = inject(DOCUMENT);

  readonly langue = signal<Langue>(this.charger());
  /** Locale pour formater les dates. */
  readonly locale = computed(() => (this.langue() === 'fr' ? 'fr-FR' : 'en-GB'));

  constructor() {
    effect(() => (this.doc.documentElement.lang = this.langue()));
  }

  /** Renvoie le texte français ou anglais selon la langue active. */
  t(fr: string, en: string): string {
    return this.langue() === 'fr' ? fr : en;
  }

  definir(langue: Langue): void {
    this.langue.set(langue);
    if (this.navigateur) {
      try {
        localStorage.setItem(CLE, langue);
      } catch {}
    }
  }

  private charger(): Langue {
    if (!this.navigateur) return 'fr';
    try {
      return localStorage.getItem(CLE) === 'en' ? 'en' : 'fr';
    } catch {
      return 'fr';
    }
  }
}

/** Dans un template : {{ 'Bonjour' | tr: 'Hello' }} */
@Pipe({ name: 'tr', pure: false })
export class TrPipe implements PipeTransform {
  private readonly i18n = inject(I18n);

  transform(fr: string, en: string): string {
    return this.i18n.t(fr, en);
  }
}
