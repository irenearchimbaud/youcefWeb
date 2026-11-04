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
  /** Nom d'origine du fichier déposé. */
  fichier: string;
  type: string;
  /** Taille en octets. */
  taille: number;
}

/** Formats acceptés pour les documents déposés, et taille maximale (le stockage est local au navigateur). */
export const TYPES_DOCUMENT = '.pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt';
export const TAILLE_MAX_DOCUMENT = 10 * 1024 * 1024;

export const formaterTaille = (octets: number): string =>
  octets < 1024 * 1024 ? `${Math.max(1, Math.round(octets / 1024))} Ko` : `${(octets / 1024 / 1024).toFixed(1)} Mo`;

/** Les PDF, images et textes s'affichent dans le navigateur ; le reste ne peut que se télécharger. */
export const estVisualisable = (type: string): boolean =>
  type === 'application/pdf' || type === 'text/plain' || type.startsWith('image/');

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

/** Récupère les rendez-vous Calendly (tous, ou ceux d'un client). Réessaie une fois : la fonction serveur peut mettre un instant à démarrer. */
export async function chargerRdv(clientId?: string, frais = false): Promise<{ configure: boolean; rdv: Rdv[] }> {
  const params = new URLSearchParams();
  if (clientId) params.set('client', clientId);
  if (frais) params.set('frais', '1');
  for (let essai = 0; ; essai++) {
    try {
      const r = await fetch(`/api/rdv?${params}`);
      if (!r.ok) throw new Error(String(r.status));
      return await r.json();
    } catch (e) {
      if (essai >= 1) throw e;
      await new Promise((ok) => setTimeout(ok, 800));
    }
  }
}
