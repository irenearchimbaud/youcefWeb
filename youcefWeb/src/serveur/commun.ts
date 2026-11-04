/** Requête / réponse indépendantes de l'hébergeur : adaptées pour Express (src/server.ts) et pour Vercel (api/*.ts). */
export interface Requete {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  /** JSON déjà décodé, ou Buffer pour un envoi de fichier (application/octet-stream). */
  body: unknown;
  query: Record<string, unknown>;
}
export interface Reponse {
  status: number;
  corps?: unknown;
  /** Contenu binaire (téléchargement d'un document) : remplace `corps`. */
  binaire?: Buffer;
  entetes?: Record<string, string>;
}

export const reponse = (status: number, corps: unknown, entetes?: Record<string, string>): Reponse => ({ status, corps, entetes });
export const erreur = (status: number, message: string): Reponse => ({ status, corps: { erreur: message } });

export const entete = (req: Requete, nom: string): string => {
  const v = req.headers[nom.toLowerCase()];
  return (Array.isArray(v) ? v[0] : v) ?? '';
};

export const texte = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');

export const corpsJson = (req: Requete): Record<string, unknown> =>
  req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body) ? (req.body as Record<string, unknown>) : {};

/**
 * Protection CSRF en plus du cookie SameSite=Strict : une requête qui modifie quelque chose doit venir de notre propre site.
 */
export function origineValide(req: Requete): boolean {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return true;
  const origine = entete(req, 'origin');
  if (!origine) return true; // requête non navigateur (curl…) : sans cookie de session de toute façon utilisable
  try {
    return new URL(origine).host === (entete(req, 'x-forwarded-host') || entete(req, 'host'));
  } catch {
    return false;
  }
}
