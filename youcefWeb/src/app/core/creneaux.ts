import { Disponibilite } from './models';

export const DUREE_SEANCE_MIN = 60;
const PREAVIS_H = 24;
export const HORIZON_JOURS = 30;

export interface Intervalle {
  debut: Date;
  fin: Date;
}

export interface JourCreneaux {
  /** Clé AAAA-MM-JJ (heure locale). */
  cle: string;
  date: Date;
  creneaux: Intervalle[];
}

const enMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const cleJour = (d: Date): string =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const chevauche = (a: Intervalle, b: Intervalle): boolean => a.debut < b.fin && b.debut < a.fin;

/**
 * Créneaux réservables : les plages de disponibilité de Youcef découpées en séances,
 * moins ce qui est déjà occupé (Google Agenda, demandes en cours) et ce qui est trop proche.
 */
export function creneauxLibres(
  dispos: Disponibilite[],
  occupes: Intervalle[],
  depuis: Date,
  jours = HORIZON_JOURS,
): JourCreneaux[] {
  const limite = new Date(depuis.getTime() + PREAVIS_H * 3_600_000);
  const resultat: JourCreneaux[] = [];

  for (let i = 0; i <= jours; i++) {
    const jour = new Date(depuis.getFullYear(), depuis.getMonth(), depuis.getDate() + i);
    const creneaux: Intervalle[] = [];

    for (const dispo of dispos.filter((d) => d.actif && d.jour === jour.getDay())) {
      const fin = enMinutes(dispo.fin);
      for (let t = enMinutes(dispo.debut); t + DUREE_SEANCE_MIN <= fin; t += DUREE_SEANCE_MIN) {
        const debut = new Date(jour.getFullYear(), jour.getMonth(), jour.getDate(), 0, t);
        const creneau = { debut, fin: new Date(debut.getTime() + DUREE_SEANCE_MIN * 60_000) };
        if (debut >= limite && !occupes.some((o) => chevauche(creneau, o))) creneaux.push(creneau);
      }
    }

    if (creneaux.length) resultat.push({ cle: cleJour(jour), date: jour, creneaux });
  }
  return resultat;
}
