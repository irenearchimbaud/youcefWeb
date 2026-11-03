export type Role = 'client' | 'pro';

export interface Utilisateur {
  id: string;
  identifiant: string;
  motDePasse: string;
  nom: string;
  role: Role;
}

export interface Document {
  id: string;
  clientId: string;
  titre: string;
  date: string;
}

export type StatutDemande = 'en attente' | 'acceptée' | 'refusée';

export interface Demande {
  id: string;
  clientId: string;
  offre: string;
  message: string;
  date: string;
  statut: StatutDemande;
}

export const classeStatut = (s: StatutDemande): string =>
  ({ 'en attente': 'attente', 'acceptée': 'acceptee', 'refusée': 'refusee' })[s];
