import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomInt } from 'node:crypto';

/** Requête / réponse indépendantes de l'hébergeur : adaptées pour Express (src/server.ts) et pour Vercel (api/*.ts). */
export interface Requete {
  method: string;
  headers: Record<string, string | string[] | undefined>;
  body: unknown;
  query: Record<string, unknown>;
}
export interface Reponse {
  status: number;
  corps: unknown;
}

export interface Profil {
  id: string;
  nom: string;
  email: string;
  role: 'client' | 'pro';
}

let admin: SupabaseClient | undefined;

/** Client Supabase avec la clé de service : ne jamais l'exposer au navigateur. */
export function supabaseAdmin(): SupabaseClient | null {
  const url = process.env['SUPABASE_URL'];
  const cle = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (!url || !cle) return null;
  return (admin ??= createClient(url, cle, { auth: { persistSession: false, autoRefreshToken: false } }));
}

export const nonConfigure = (): Reponse => ({
  status: 503,
  corps: { erreur: 'Le serveur n’est pas configuré (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).' },
});

/** Identifie l'appelant à partir de son jeton de session Supabase (en-tête Authorization: Bearer …). */
export async function appelant(req: Requete): Promise<Profil | null> {
  const db = supabaseAdmin();
  const brut = req.headers['authorization'];
  const jeton = (Array.isArray(brut) ? brut[0] : brut)?.replace(/^Bearer\s+/i, '');
  if (!db || !jeton) return null;
  const { data } = await db.auth.getUser(jeton);
  if (!data.user) return null;
  const { data: profil } = await db.from('profiles').select('id, nom, email, role').eq('id', data.user.id).single();
  return (profil as Profil | null) ?? null;
}

// Sans caractères ambigus (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

/** Code de première connexion : 12 caractères tirés avec un générateur cryptographique, ex. K7M2-QX9P-4TNR. */
export function genererCode(): string {
  const c = Array.from({ length: 12 }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
  return `${c.slice(0, 4)}-${c.slice(4, 8)}-${c.slice(8)}`;
}

export const texte = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
