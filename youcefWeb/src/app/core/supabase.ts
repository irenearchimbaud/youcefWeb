import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { SupabaseClient, createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from './config';

/** Client Supabase du navigateur (null côté serveur : les pages protégées ne sont rendues que dans le navigateur). */
@Injectable({ providedIn: 'root' })
export class Supabase {
  readonly client: SupabaseClient | null = isPlatformBrowser(inject(PLATFORM_ID))
    ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
      })
    : null;

  /** Le client, ou une erreur claire si on l'utilise côté serveur. */
  get db(): SupabaseClient {
    if (!this.client) throw new Error('Supabase indisponible côté serveur.');
    return this.client;
  }
}
