import { mkdir, readFile, readdir, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { randomBytes } from 'node:crypto';
import { chiffrer, dechiffrer } from './securite';

/**
 * Stockage des données du site. Tout est chiffré (AES-256-GCM) avant d'être écrit, quel que soit le support :
 *  - Vercel Blob si BLOB_READ_WRITE_TOKEN est défini (hébergement Vercel : onglet Storage du projet) ;
 *  - sinon un dossier sur disque (DATA_DIR, par défaut ./donnees) : développement local ou serveur personnel.
 * Les chemins sont logiques (« utilisateurs/<id> », « fichiers/<client>/<doc> »…).
 */
interface Support {
  lire(chemin: string): Promise<Buffer | null>;
  ecrire(chemin: string, donnees: Buffer): Promise<void>;
  supprimer(chemin: string): Promise<void>;
  /** Chemins logiques commençant par ce préfixe. */
  lister(prefixe: string): Promise<string[]>;
}

// ---------------------------------------------------------------------------
// Disque
// ---------------------------------------------------------------------------
function supportDisque(): Support {
  const racine = () => process.env['DATA_DIR'] || join(process.cwd(), 'donnees');
  const chemin = (p: string) => {
    if (p.includes('..') || p.startsWith('/')) throw new Error('Chemin invalide.');
    return join(racine(), p);
  };
  return {
    async lire(p) {
      try {
        return await readFile(chemin(p));
      } catch (e) {
        if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null;
        throw e;
      }
    },
    async ecrire(p, donnees) {
      const cible = chemin(p);
      await mkdir(dirname(cible), { recursive: true });
      const temporaire = `${cible}.${randomBytes(4).toString('hex')}.tmp`;
      await writeFile(temporaire, donnees);
      await rename(temporaire, cible); // remplacement atomique
    },
    async supprimer(p) {
      await rm(chemin(p), { force: true, recursive: true });
    },
    async lister(prefixe) {
      const resultat: string[] = [];
      const parcourir = async (dossier: string, logique: string): Promise<void> => {
        let entrees;
        try {
          entrees = await readdir(dossier, { withFileTypes: true });
        } catch {
          return;
        }
        for (const e of entrees) {
          const l = logique ? `${logique}/${e.name}` : e.name;
          if (e.isDirectory()) await parcourir(join(dossier, e.name), l);
          else if (!e.name.endsWith('.tmp') && l.startsWith(prefixe)) resultat.push(l);
        }
      };
      await parcourir(racine(), '');
      return resultat;
    },
  };
}

// ---------------------------------------------------------------------------
// Vercel Blob
// ---------------------------------------------------------------------------
/**
 * Chaque écriture crée un NOUVEAU fichier « <chemin>@<horodatage> » et supprime les précédents : une adresse donnée ne
 * change jamais de contenu, ce qui évite de lire une version périmée gardée en cache par le réseau de Vercel.
 * Le contenu étant chiffré, l'accès « public » de Blob n'expose rien de lisible.
 */
function supportBlob(): Support {
  const jeton = process.env['BLOB_READ_WRITE_TOKEN'];
  const importer = () => import('@vercel/blob');
  const versions = async (p: string) => {
    const { list } = await importer();
    const trouves: { url: string; pathname: string }[] = [];
    let curseur: string | undefined;
    do {
      const page = await list({ prefix: `${p}@`, cursor: curseur, token: jeton });
      trouves.push(...page.blobs.filter((b) => b.pathname.startsWith(`${p}@`)));
      curseur = page.hasMore ? page.cursor : undefined;
    } while (curseur);
    return trouves.sort((a, b) => a.pathname.localeCompare(b.pathname));
  };
  return {
    async lire(p) {
      const v = (await versions(p)).at(-1);
      if (!v) return null;
      const r = await fetch(v.url, { cache: 'no-store' });
      if (!r.ok) throw new Error(`Lecture du stockage impossible (${r.status}).`);
      return Buffer.from(await r.arrayBuffer());
    },
    async ecrire(p, donnees) {
      const { put, del } = await importer();
      const avant = await versions(p);
      await put(`${p}@${String(Date.now()).padStart(15, '0')}-${randomBytes(3).toString('hex')}`, donnees, {
        access: 'public',
        addRandomSuffix: false,
        contentType: 'application/octet-stream',
        token: jeton,
      });
      if (avant.length) await del(avant.map((b) => b.url), { token: jeton });
    },
    async supprimer(p) {
      const { del } = await importer();
      const v = await versions(p);
      if (v.length) await del(v.map((b) => b.url), { token: jeton });
    },
    async lister(prefixe) {
      const { list } = await importer();
      const noms = new Set<string>();
      let curseur: string | undefined;
      do {
        const page = await list({ prefix: prefixe, cursor: curseur, token: jeton });
        for (const b of page.blobs) noms.add(b.pathname.replace(/@[^@/]*$/, ''));
        curseur = page.hasMore ? page.cursor : undefined;
      } while (curseur);
      return [...noms];
    },
  };
}

const support = (): Support => (process.env['BLOB_READ_WRITE_TOKEN'] ? supportBlob() : supportDisque());

// ---------------------------------------------------------------------------
// API chiffrée utilisée par le reste du serveur
// ---------------------------------------------------------------------------
export const lireOctets = async (chemin: string): Promise<Buffer | null> => {
  const brut = await support().lire(chemin);
  return brut ? dechiffrer(brut) : null;
};
export const ecrireOctets = (chemin: string, donnees: Buffer): Promise<void> => support().ecrire(chemin, chiffrer(donnees));

export async function lireJson<T>(chemin: string): Promise<T | null> {
  const o = await lireOctets(chemin);
  return o ? (JSON.parse(o.toString('utf8')) as T) : null;
}
export const ecrireJson = (chemin: string, valeur: unknown): Promise<void> => ecrireOctets(chemin, Buffer.from(JSON.stringify(valeur)));

export const supprimer = (chemin: string): Promise<void> => support().supprimer(chemin);
export const lister = (prefixe: string): Promise<string[]> => support().lister(prefixe);
export const existe = async (chemin: string): Promise<boolean> => (await support().lire(chemin)) !== null;
