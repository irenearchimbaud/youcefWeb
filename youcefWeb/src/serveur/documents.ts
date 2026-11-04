import { randomUUID } from 'node:crypto';
import { Reponse, Requete, erreur, reponse, texte } from './commun';
import { idValide, trouverParId } from './comptes';
import { appelant } from './session';
import { ecrireJson, ecrireOctets, lireJson, lireOctets, lister, supprimer } from './stockage';

export interface DocumentMeta {
  id: string;
  clientId: string;
  titre: string;
  fichier: string;
  type: string;
  taille: number;
  date: string;
}

/** Limite de l'hébergeur Vercel : 4,5 Mo par requête. */
const TAILLE_MAX = 4 * 1024 * 1024;
const TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/plain',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);
// Aperçu dans le navigateur : on exclut le HTML/SVG, qui pourraient exécuter du code.
const APERCU = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp', 'text/plain']);

const cheminMeta = (client: string, doc: string) => `documents/${client}/${doc}`;
const cheminFichier = (client: string, doc: string) => `fichiers/${client}/${doc}`;

async function metas(clientId?: string): Promise<DocumentMeta[]> {
  const chemins = await lister(clientId ? `documents/${clientId}/` : 'documents/');
  const liste = await Promise.all(chemins.map((p) => lireJson<DocumentMeta>(p)));
  return liste.filter((d): d is DocumentMeta => !!d).sort((a, b) => b.date.localeCompare(a.date));
}

export async function supprimerDocumentsDe(clientId: string): Promise<void> {
  for (const m of await metas(clientId)) {
    await supprimer(cheminFichier(clientId, m.id));
    await supprimer(cheminMeta(clientId, m.id));
  }
}

/**
 *  GET                                         liste des documents (tous pour Youcef, les siens pour un client)
 *  GET ?id=…[&telecharger=1]                   contenu d'un document (aperçu ou téléchargement)
 *  POST ?clientId=…&titre=…&nom=…&type=…       dépôt (corps = le fichier), réservé à Youcef
 *  DELETE ?id=…&clientId=…                     suppression, réservée à Youcef
 */
export async function documents(req: Requete): Promise<Reponse> {
  const moi = await appelant(req);
  if (!moi) return erreur(401, 'Connexion requise.');
  const q = (k: string, max = 200) => texte(req.query[k], max);

  if (req.method === 'GET') {
    const id = q('id', 64);
    if (!id) return reponse(200, { documents: await metas(moi.role === 'pro' ? undefined : moi.id) });

    // Un client ne peut ouvrir que ses documents : son identifiant est imposé, quel que soit le paramètre.
    const clientId = moi.role === 'pro' ? q('clientId', 64) : moi.id;
    if (!idValide(id) || !idValide(clientId)) return erreur(404, 'Document introuvable.');
    const meta = await lireJson<DocumentMeta>(cheminMeta(clientId, id));
    const contenu = meta ? await lireOctets(cheminFichier(clientId, id)) : null;
    if (!meta || !contenu) return erreur(404, 'Document introuvable.');

    const apercu = APERCU.has(meta.type) && q('telecharger') !== '1';
    const nom = encodeURIComponent(meta.fichier);
    return {
      status: 200,
      binaire: contenu,
      entetes: {
        'Content-Type': apercu ? meta.type : 'application/octet-stream',
        'Content-Disposition': `${apercu ? 'inline' : 'attachment'}; filename*=UTF-8''${nom}`,
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'private, no-store',
      },
    };
  }

  if (moi.role !== 'pro') return erreur(403, 'Accès réservé.');

  if (req.method === 'POST') {
    const clientId = q('clientId', 64);
    const client = idValide(clientId) ? await trouverParId(clientId) : null;
    if (!client || client.role !== 'client') return erreur(404, 'Client introuvable.');
    const type = q('type', 100);
    if (!TYPES.has(type)) return erreur(415, 'Format non accepté (PDF, images, Word ou texte).');
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) return erreur(400, 'Fichier manquant.');
    if (req.body.length > TAILLE_MAX) return erreur(413, 'Fichier trop volumineux (4 Mo maximum).');

    const meta: DocumentMeta = {
      id: randomUUID(),
      clientId,
      titre: q('titre', 150) || q('nom', 150) || 'Document',
      fichier: q('nom', 150) || 'document',
      type,
      taille: req.body.length,
      date: new Date().toISOString(),
    };
    await ecrireOctets(cheminFichier(clientId, meta.id), req.body);
    await ecrireJson(cheminMeta(clientId, meta.id), meta);
    return reponse(201, { document: meta });
  }

  if (req.method === 'DELETE') {
    const id = q('id', 64);
    const clientId = q('clientId', 64);
    if (!idValide(id) || !idValide(clientId)) return erreur(404, 'Document introuvable.');
    await supprimer(cheminFichier(clientId, id));
    await supprimer(cheminMeta(clientId, id));
    return reponse(200, { ok: true });
  }

  return erreur(405, 'Méthode non autorisée.');
}
