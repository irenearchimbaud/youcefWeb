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

/** Séance réservée via Calendly ; le détail (date, lien de visio) est dans l'agenda et l'e-mail de confirmation. */
export interface Reservation {
  id: string;
  clientId: string;
  /** Date de la réservation (AAAA-MM-JJ). */
  date: string;
}
