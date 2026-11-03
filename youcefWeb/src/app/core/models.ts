export type Role = 'client' | 'pro';

export interface Utilisateur {
  id: string;
  identifiant: string;
  /** Code d'accès généré aléatoirement par Youcef à la création du client. */
  code: string;
  nom: string;
  role: Role;
  /** Nombre de séances restantes (clients uniquement). */
  solde: number;
}

export interface Document {
  id: string;
  clientId: string;
  titre: string;
  date: string;
}

export type StatutDemande = 'en attente' | 'acceptée' | 'refusée';

/** Demande de séance sur un créneau précis ; acceptée, elle décompte une séance du solde. */
export interface Demande {
  id: string;
  clientId: string;
  /** Début et fin du créneau, en ISO 8601 (UTC). */
  debut: string;
  fin: string;
  message: string;
  date: string;
  statut: StatutDemande;
}

/** Plage hebdomadaire pendant laquelle Youcef accepte des séances. */
export interface Disponibilite {
  /** 0 = dimanche … 6 = samedi (convention de Date.getDay). */
  jour: number;
  actif: boolean;
  debut: string; // HH:MM
  fin: string; // HH:MM
}

export const classeStatut = (s: StatutDemande): string =>
  ({ 'en attente': 'attente', 'acceptée': 'acceptee', 'refusée': 'refusee' })[s];

export const formaterCreneau = (debut: string, fin: string): string => {
  const d = new Date(debut);
  const jour = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
  const heure = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  return `${jour}, ${heure(debut)} – ${heure(fin)}`;
};
