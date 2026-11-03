import { randomBytes } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const env = process.env;

const FICHIER_JETON = join(process.cwd(), '.google-token.json');
const CALENDRIER = env['GOOGLE_CALENDAR_ID'] ?? 'primary';
const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly'];

interface Jeton {
  refresh_token: string;
  access_token?: string;
  expiration?: number;
}

export interface Rdv {
  id: string;
  titre: string;
  debut: string;
  fin: string;
  lien?: string;
  visio?: string;
}

// États OAuth émis et pas encore consommés (protège le callback d'un appel forgé).
const etats = new Set<string>();
let jetonEnCache: Jeton | null | undefined;

export const configure = (): boolean => !!(env['GOOGLE_CLIENT_ID'] && env['GOOGLE_CLIENT_SECRET']);

async function lireJeton(): Promise<Jeton | null> {
  if (jetonEnCache !== undefined) return jetonEnCache;
  try {
    jetonEnCache = JSON.parse(await readFile(FICHIER_JETON, 'utf8'));
  } catch {
    jetonEnCache = null;
  }
  return jetonEnCache ?? null;
}

async function ecrireJeton(jeton: Jeton | null): Promise<void> {
  jetonEnCache = jeton;
  if (jeton) await writeFile(FICHIER_JETON, JSON.stringify(jeton), { mode: 0o600 });
  else await rm(FICHIER_JETON, { force: true });
}

export async function connecte(): Promise<boolean> {
  return configure() && (await lireJeton()) !== null;
}

async function appelJeton(params: Record<string, string>): Promise<{ access_token: string; expires_in: number; refresh_token?: string }> {
  const reponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: env['GOOGLE_CLIENT_ID']!,
      client_secret: env['GOOGLE_CLIENT_SECRET']!,
      ...params,
    }),
  });
  if (!reponse.ok) {
    // Accès révoqué côté Google : il faudra reconnecter l'agenda.
    if (params['grant_type'] === 'refresh_token' && reponse.status === 400) await ecrireJeton(null);
    throw new Error(`Google OAuth ${reponse.status}`);
  }
  return reponse.json();
}

/** URL de la page de consentement Google (à ouvrir par Youcef). */
export function urlConnexion(redirectUri: string): string {
  const etat = randomBytes(16).toString('hex');
  etats.add(etat);
  const params = new URLSearchParams({
    client_id: env['GOOGLE_CLIENT_ID']!,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent', // garantit l'émission d'un refresh_token
    state: etat,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export async function finaliserConnexion(code: string, etat: string, redirectUri: string): Promise<void> {
  if (!etats.delete(etat)) throw new Error('État OAuth inconnu');
  const rep = await appelJeton({ grant_type: 'authorization_code', code, redirect_uri: redirectUri });
  if (!rep.refresh_token) throw new Error('Pas de refresh_token reçu');
  await ecrireJeton({
    refresh_token: rep.refresh_token,
    access_token: rep.access_token,
    expiration: Date.now() + rep.expires_in * 1000,
  });
}

export const deconnecter = (): Promise<void> => ecrireJeton(null);

async function jetonAcces(): Promise<string> {
  const jeton = await lireJeton();
  if (!jeton) throw new Error('Google Agenda non connecté');
  if (jeton.access_token && (jeton.expiration ?? 0) > Date.now() + 60_000) return jeton.access_token;

  const rep = await appelJeton({ grant_type: 'refresh_token', refresh_token: jeton.refresh_token });
  await ecrireJeton({ ...jeton, access_token: rep.access_token, expiration: Date.now() + rep.expires_in * 1000 });
  return rep.access_token;
}

/** Prochains rendez-vous de l'agenda de Youcef (dont ceux réservés via Calendly). */
export async function prochainsRdv(max = 20): Promise<Rdv[]> {
  const params = new URLSearchParams({
    timeMin: new Date().toISOString(),
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(max),
  });
  const reponse = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(CALENDRIER)}/events?${params}`,
    { headers: { Authorization: `Bearer ${await jetonAcces()}` } },
  );
  if (!reponse.ok) throw new Error(`Google Agenda ${reponse.status}: ${await reponse.text()}`);
  const { items = [] } = (await reponse.json()) as { items?: any[] };
  return items
    .filter((e) => e.status !== 'cancelled' && e.start?.dateTime)
    .map((e) => ({
      id: e.id,
      titre: e.summary ?? '(sans titre)',
      debut: e.start.dateTime,
      fin: e.end?.dateTime ?? e.start.dateTime,
      lien: e.htmlLink,
      visio: e.hangoutLink ?? e.conferenceData?.entryPoints?.find((p: any) => p.entryPointType === 'video')?.uri,
    }));
}
