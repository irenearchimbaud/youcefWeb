import { createCipheriv, createDecipheriv, createHmac, hkdfSync, randomBytes, randomInt, scrypt, timingSafeEqual } from 'node:crypto';

/** Erreur de configuration (secret absent ou trop court) : jamais renvoyée telle quelle au navigateur. */
export class ErreurConfig extends Error {}

const secret = (): string => {
  const s = process.env['APP_SECRET'];
  if (!s || s.length < 32) throw new ErreurConfig('APP_SECRET absent ou trop court (32 caractères minimum).');
  return s;
};

/** Clés dérivées du secret unique, une par usage (chiffrement des données / signature des jetons). */
const cle = (usage: 'donnees' | 'jetons'): Buffer => Buffer.from(hkdfSync('sha256', secret(), 'youcef-site', usage, 32));

// --- Chiffrement des données au repos (AES-256-GCM) : le stockage ne contient jamais rien en clair ---

export function chiffrer(donnees: Buffer): Buffer {
  const iv = randomBytes(12);
  const c = createCipheriv('aes-256-gcm', cle('donnees'), iv);
  const chiffre = Buffer.concat([c.update(donnees), c.final()]);
  return Buffer.concat([iv, c.getAuthTag(), chiffre]);
}

export function dechiffrer(donnees: Buffer): Buffer {
  const d = createDecipheriv('aes-256-gcm', cle('donnees'), donnees.subarray(0, 12));
  d.setAuthTag(donnees.subarray(12, 28));
  return Buffer.concat([d.update(donnees.subarray(28)), d.final()]);
}

// --- Mots de passe : scrypt avec sel aléatoire, jamais stockés ni récupérables ---

const scryptAsync = (mdp: string, sel: Buffer): Promise<Buffer> =>
  new Promise((ok, ko) => scrypt(mdp, sel, 64, { N: 16384, r: 8, p: 1 }, (e, k) => (e ? ko(e) : ok(k))));

export async function hacher(motDePasse: string): Promise<string> {
  const sel = randomBytes(16);
  return `${sel.toString('base64')}$${(await scryptAsync(motDePasse, sel)).toString('base64')}`;
}

export async function verifierMotDePasse(motDePasse: string, stocke: string): Promise<boolean> {
  const [sel, hash] = stocke.split('$');
  if (!sel || !hash) return false;
  const attendu = Buffer.from(hash, 'base64');
  const calcule = await scryptAsync(motDePasse, Buffer.from(sel, 'base64'));
  return attendu.length === calcule.length && timingSafeEqual(attendu, calcule);
}

// --- Jetons signés (session, lien de réinitialisation) ---

const b64 = (b: Buffer | string): string => Buffer.from(b).toString('base64url');
const signature = (donnees: string): string => b64(createHmac('sha256', cle('jetons')).update(donnees).digest());

export function signer(charge: Record<string, unknown>, dureeSecondes: number): string {
  const corps = b64(JSON.stringify({ ...charge, exp: Math.floor(Date.now() / 1000) + dureeSecondes }));
  return `${corps}.${signature(corps)}`;
}

export function verifier<T extends Record<string, unknown>>(jeton: string): T | null {
  const [corps, sig] = jeton.split('.');
  if (!corps || !sig) return null;
  const attendue = Buffer.from(signature(corps));
  const recue = Buffer.from(sig);
  if (attendue.length !== recue.length || !timingSafeEqual(attendue, recue)) return null;
  try {
    const charge = JSON.parse(Buffer.from(corps, 'base64url').toString('utf8')) as T & { exp?: number };
    return typeof charge.exp === 'number' && charge.exp > Date.now() / 1000 ? charge : null;
  } catch {
    return null;
  }
}

// Sans caractères ambigus (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Code de première connexion : 12 caractères tirés avec un générateur cryptographique, ex. K7M2-QX9P-4TNR. */
export function genererCode(): string {
  const c = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}
