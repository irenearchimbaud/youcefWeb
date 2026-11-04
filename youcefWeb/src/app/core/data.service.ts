import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { AuthService } from './auth.service';
import { Document, Utilisateur } from './models';

type ReponseDocument = Omit<Document, 'date'> & { date: string };

const versDocument = (d: ReponseDocument): Document => ({ ...d, date: d.date.slice(0, 10) });

/** Données du site, stockées sur le serveur (src/serveur). Le serveur ne renvoie à chacun que ce qui le concerne. */
@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly auth = inject(AuthService);

  /** Clients de Youcef (vide pour un client). */
  readonly clients = signal<Utilisateur[]>([]);
  /** Documents visibles par la personne connectée (tous pour Youcef, les siens pour un client). */
  readonly documents = signal<Document[]>([]);

  constructor() {
    effect(() => {
      const u = this.auth.utilisateur();
      untracked(() => {
        if (!u || u.doitChangerMdp) {
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
    try {
      const [docs, clients] = await Promise.all([
        this.auth.appelerApi('/api/documents'),
        pro ? this.auth.appelerApi('/api/clients') : Promise.resolve(null),
      ]);
      if (docs.ok) this.documents.set(((await docs.json()).documents as ReponseDocument[]).map(versDocument));
      if (clients?.ok) this.clients.set((await clients.json()).clients);
    } catch {
      // Garde l'affichage précédent : une coupure réseau ne doit pas vider les listes.
    }
  }

  private async appel(chemin: string, init: RequestInit): Promise<any> {
    const r = await this.auth.appelerApi(chemin, init);
    const corps = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(corps.erreur ?? String(r.status));
    return corps;
  }

  // --- Clients (gérés par Youcef) ---

  async ajouterClient(nom: string, email: string, solde: number): Promise<{ client: Utilisateur; code: string }> {
    const corps = await this.appel('/api/clients', { method: 'POST', body: JSON.stringify({ nom, email, solde }) });
    await this.recharger();
    return corps;
  }

  async regenererCode(id: string): Promise<string> {
    const corps = await this.appel('/api/clients', { method: 'PATCH', body: JSON.stringify({ id, action: 'code' }) });
    await this.recharger();
    return corps.code;
  }

  async supprimerClient(id: string): Promise<void> {
    await this.appel(`/api/clients?id=${encodeURIComponent(id)}`, { method: 'DELETE' });
    await this.recharger();
  }

  async definirSolde(id: string, solde: number): Promise<void> {
    const { client } = await this.appel('/api/clients', { method: 'PATCH', body: JSON.stringify({ id, solde }) });
    this.clients.update((l) => l.map((c) => (c.id === id ? client : c)));
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
    const params = new URLSearchParams({ clientId, titre: titre.trim() || fichier.name, nom: fichier.name, type: fichier.type });
    const r = await this.auth.appelerApi(`/api/documents?${params}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: fichier,
    });
    if (!r.ok) throw new Error(((await r.json().catch(() => ({}))).erreur as string) ?? String(r.status));
    await this.recharger();
  }

  async supprimerDocument(doc: Document): Promise<void> {
    await this.appel(`/api/documents?id=${doc.id}&clientId=${doc.clientId}`, { method: 'DELETE' });
    this.documents.update((l) => l.filter((d) => d.id !== doc.id));
  }

  private lien(doc: Document, telecharger: boolean): string {
    return `/api/documents?id=${doc.id}&clientId=${doc.clientId}${telecharger ? '&telecharger=1' : ''}`;
  }

  /** Ouvre le document dans un nouvel onglet (le cookie de session suffit : pas de lien public). */
  async visualiser(doc: Document): Promise<boolean> {
    window.open(this.lien(doc, false), '_blank', 'noopener');
    return true;
  }

  async telecharger(doc: Document): Promise<boolean> {
    const a = document.createElement('a');
    a.href = this.lien(doc, true);
    a.download = doc.fichier;
    a.click();
    return true;
  }
}
