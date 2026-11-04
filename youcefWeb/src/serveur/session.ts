import { Requete, entete } from './commun';
import { Compte, trouverParId } from './comptes';
import { signer, verifier } from './securite';

const NOM = 'session';
const DUREE = 7 * 24 * 3600;

const lireCookie = (req: Requete, nom: string): string | null => {
  for (const morceau of entete(req, 'cookie').split(';')) {
    const [k, ...v] = morceau.trim().split('=');
    if (k === nom) return v.join('=');
  }
  return null;
};

const https = (req: Requete): boolean => entete(req, 'x-forwarded-proto') === 'https';

/** Cookie de session : illisible par le JavaScript de la page (HttpOnly), envoyé uniquement à notre site (SameSite=Strict). */
export function ouvrirSession(req: Requete, c: Compte): Record<string, string> {
  const jeton = signer({ t: 'session', id: c.id, v: c.version }, DUREE);
  return { 'Set-Cookie': `${NOM}=${jeton}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${DUREE}${https(req) ? '; Secure' : ''}` };
}

export const fermerSession = (req: Requete): Record<string, string> => ({
  'Set-Cookie': `${NOM}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${https(req) ? '; Secure' : ''}`,
});

/** Compte connecté, ou null. Une session est invalide dès que le mot de passe a changé depuis son émission. */
export async function appelant(req: Requete): Promise<Compte | null> {
  const jeton = lireCookie(req, NOM);
  const charge = jeton ? verifier<{ t: string; id: string; v: number }>(jeton) : null;
  if (!charge || charge.t !== 'session') return null;
  const c = await trouverParId(charge.id);
  return c && c.version === charge.v ? c : null;
}
