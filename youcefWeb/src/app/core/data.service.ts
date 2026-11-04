import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from './auth.service';
import { Document, Utilisateur } from './models';
import { Supabase } from './supabase';

type LigneDocument = {
  id: string;
  client_id: string;
  titre: string;
  fichier: string;
  type: string;
  taille: number;
  chemin: string;
  created_at: string;
};

const versDocument = (l: LigneDocument): Document => ({
  id: l.id,
  clientId: l.client_id,
  titre: l.titre,
  date: l.created_at.slice(0, 10),
  fichier: l.fichier,
  type: l.type,
  taille: l.taille,
  chemin: l.chemin,
});

/** Nom de fichier sûr pour le stockage (sans accents ni caractères spéciaux). */
const nomSur = (nom: string): string => nom.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^A-Za-z0-9._-]+/g, '_').slice(-80);

/** Données du site, stockées dans Supabase. Les règles d'accès (RLS) garantissent que chacun ne voit que ses propres données. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly auth = inject(AuthService);
  private readonly supabase = inject(Supabase);

  /** Clients de Youcef (vide pour un client). */
  readonly clients = signal<Utilisateur[]>([]);
  /** Documents visibles par la personne connectée (tous pour Youcef, les siens pour un client). */
  readonly documents = signal<Document[]>([]);

  constructor() {
    effect(() => {
      const u = this.auth.utilisateur();
      untracked(() => {
        if (!u) {
          this.clients.set([]);
          this.documents.set([]);
        } else {
          void this.recharger(u.role === 'pro');
        }
      });
    });
  }

  utilisateur(id: string): Utilisateur | undefined {
    return this.clients().find((u) => u.id === id) ?? (this.auth.utilisateur()?.id === id ? this.auth.utilisateur()! : undefined);
  }

  documentsDe(clientId: string): Document[] {
    return this.documents().filter((d) => d.clientId === clientId);
  }

  async recharger(pro = this.auth.utilisateur()?.role === 'pro'): Promise<void> {
    const sb = this.supabase.db;
    const [docs, clients] = await Promise.all([
      sb.from('documents').select('*').order('created_at', { ascending: false }),
      pro ? sb.from('profiles').select('id, nom, email, role, solde, doit_changer_mdp').eq('role', 'client').order('nom') : Promise.resolve(null),
    ]);
    if (docs.data) this.documents.set((docs.data as LigneDocument[]).map(versDocument));
    if (clients?.data) {
      this.clients.set(
        clients.data.map((c) => ({ id: c.id, nom: c.nom, email: c.email, role: c.role, solde: c.solde, doitChangerMdp: c.doit_changer_mdp })),
      );
    }
  }

  // --- Clients (gérés par Youcef ; création, nouveau code et suppression passent par le serveur) ---

  async ajouterClient(nom: string, email: string, solde: number): Promise<{ client: Utilisateur; code: string }> {
    const r = await this.auth.appelerApi('/api/clients', { method: 'POST', body: JSON.stringify({ nom, email, solde }) });
    const corps = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(corps.erreur ?? String(r.status));
    await this.recharger();
    return { client: this.utilisateur(corps.client.id)!, code: corps.code };
  }

  async regenererCode(id: string): Promise<string> {
    const r = await this.auth.appelerApi('/api/clients', { method: 'PATCH', body: JSON.stringify({ id }) });
    const corps = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(corps.erreur ?? String(r.status));
    await this.recharger();
    return corps.code;
  }

  async supprimerClient(id: string): Promise<void> {
    const r = await this.auth.appelerApi(`/api/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    if (!r.ok) throw new Error(String(r.status));
    await this.recharger();
  }

  async definirSolde(id: string, solde: number): Promise<void> {
    const valeur = Math.max(0, Math.floor(solde));
    const { error } = await this.supabase.db.from('profiles').update({ solde: valeur }).eq('id', id);
    if (error) throw error;
    this.clients.update((l) => l.map((c) => (c.id === id ? { ...c, solde: valeur } : c)));
  }

  /** Après une réservation Calendly : le serveur vérifie la réservation et décompte la séance. */
  async consommerSeance(): Promise<number> {
    const r = await this.auth.appelerApi('/api/seance', { method: 'POST' });
    const corps = await r.json().catch(() => ({}));
    await this.auth.rafraichirProfil();
    return r.ok ? (corps.decomptees ?? 0) : 0;
  }

  // --- Documents ---

  async ajouterDocument(clientId: string, titre: string, fichier: File): Promise<void> {
    const sb = this.supabase.db;
    const chemin = `${clientId}/${crypto.randomUUID()}-${nomSur(fichier.name)}`;
    const envoi = await sb.storage.from('documents').upload(chemin, fichier, { contentType: fichier.type || undefined });
    if (envoi.error) throw envoi.error;
    const { error } = await sb.from('documents').insert({
      client_id: clientId,
      titre: titre.trim() || fichier.name,
      fichier: fichier.name,
      type: fichier.type || 'application/octet-stream',
      taille: fichier.size,
      chemin,
    });
    if (error) {
      await sb.storage.from('documents').remove([chemin]);
      throw error;
    }
    await this.recharger();
  }

  async supprimerDocument(doc: Document): Promise<void> {
    const sb = this.supabase.db;
    const { error } = await sb.from('documents').delete().eq('id', doc.id);
    if (error) throw error;
    await sb.storage.from('documents').remove([doc.chemin]);
    this.documents.update((l) => l.filter((d) => d.id !== doc.id));
  }

  /** Ouvre le document dans un nouvel onglet (à appeler directement depuis le clic, sinon le navigateur bloque la fenêtre). */
  async visualiser(doc: Document): Promise<boolean> {
    const fenetre = window.open('', '_blank');
    const { data } = await this.supabase.db.storage.from('documents').createSignedUrl(doc.chemin, 60);
    if (!data?.signedUrl) {
      fenetre?.close();
      return false;
    }
    if (fenetre) fenetre.location.href = data.signedUrl;
    return true;
  }

  async telecharger(doc: Document): Promise<boolean> {
    const { data } = await this.supabase.db.storage.from('documents').createSignedUrl(doc.chemin, 60, { download: doc.fichier });
    if (!data?.signedUrl) return false;
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = doc.fichier;
    a.click();
    return true;
  }
}
