import { randomBytes } from 'node:crypto';
import { readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const env = process.env;

const FICHIER_JETON = join(process.cwd(), '.google-token.json');
const CALENDRIER = env['GOOGLE_CALENDAR_ID'] ?? 'primary';
const FUSEAU = 'Europe/Paris';
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.freebusy',
];

interface Jeton {
  refresh_token: string;
  access_token?: string;
  expiration?: number;
}

export interface PlageOccupee {
  start: string;
  end: string;
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

async function appelAgenda<T>(chemin: string, corps: unknown): Promise<T> {
  const reponse = await fetch(`https://www.googleapis.com/calendar/v3${chemin}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${await jetonAcces()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(corps),
  });
  if (!reponse.ok) throw new Error(`Google Agenda ${reponse.status}: ${await reponse.text()}`);
  return reponse.json();
}

/** Plages déjà occupées dans l'agenda de Youcef entre deux dates. */
export async function plagesOccupees(debut: string, fin: string): Promise<PlageOccupee[]> {
  const rep = await appelAgenda<{ calendars: Record<string, { busy?: PlageOccupee[] }> }>('/freeBusy', {
    timeMin: debut,
    timeMax: fin,
    timeZone: FUSEAU,
    items: [{ id: CALENDRIER }],
  });
  return rep.calendars[CALENDRIER]?.busy ?? [];
}

/** Crée la séance dans l'agenda de Youcef, avec un lien de visio Google Meet. */
export async function creerEvenement(e: { debut: string; fin: string; client: string }): Promise<{ lien?: string }> {
  const rep = await appelAgenda<{ htmlLink?: string }>(
    `/calendars/${encodeURIComponent(CALENDRIER)}/events?conferenceDataVersion=1`,
    {
      summary: `Séance : ${e.client}`,
      start: { dateTime: e.debut, timeZone: FUSEAU },
      end: { dateTime: e.fin, timeZone: FUSEAU },
      conferenceData: {
        createRequest: { requestId: randomBytes(8).toString('hex'), conferenceSolutionKey: { type: 'hangoutsMeet' } },
      },
    },
  );
  return { lien: rep.htmlLink };
}
