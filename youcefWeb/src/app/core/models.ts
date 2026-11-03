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

/** Rendez-vous Calendly à venir (renvoyé par /api/rdv). */
export interface Rdv {
  id: string;
  titre: string;
  debut: string;
  fin: string;
  lien?: string;
  invite: string;
  clientId?: string;
}

export const formaterCreneau = (debut: string, fin: string): string => {
  const jour = new Date(debut).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'Europe/Paris' });
  const heure = (iso: string) =>
    new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' });
  return `${jour}, ${heure(debut)} – ${heure(fin)}`;
};

/** Récupère les rendez-vous Calendly (tous, ou ceux d'un client). */
export async function chargerRdv(clientId?: string, frais = false): Promise<{ configure: boolean; rdv: Rdv[] }> {
  const params = new URLSearchParams();
  if (clientId) params.set('client', clientId);
  if (frais) params.set('frais', '1');
  const r = await fetch(`/api/rdv?${params}`);
  if (!r.ok) throw new Error(String(r.status));
  return r.json();
}
