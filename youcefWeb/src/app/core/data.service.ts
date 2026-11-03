import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Demande, Disponibilite, Document, Utilisateur } from './models';

const CLES = {
  utilisateurs: 'youcef-utilisateurs',
  demandes: 'youcef-demandes-v2',
  disponibilites: 'youcef-disponibilites',
};

// Données de démonstration, en attendant la base SQL.
const UTILISATEURS: Utilisateur[] = [
  { id: 'u1', identifiant: 'youcef', code: 'pro123', nom: 'Youcef', role: 'pro', solde: 0 },
  { id: 'u2', identifiant: 'marie-dupont', code: 'K7M2-QX9P', nom: 'Marie Dupont', role: 'client', solde: 10 },
  { id: 'u3', identifiant: 'paul-martin', code: 'T4NR-8WHD', nom: 'Paul Martin', role: 'client', solde: 5 },
];

const DOCUMENTS: Document[] = [
  { id: 'd1', clientId: 'u2', titre: 'Contrat d\'accompagnement', date: '2026-09-02' },
  { id: 'd2', clientId: 'u2', titre: 'Compte rendu - séance 1', date: '2026-09-09' },
  { id: 'd3', clientId: 'u2', titre: 'Exercices estime de soi', date: '2026-09-16' },
  { id: 'd4', clientId: 'u3', titre: 'Contrat d\'accompagnement', date: '2026-10-01' },
];

// Du lundi au dimanche, avec des horaires de bureau par défaut (semaine active).
const DISPONIBILITES: Disponibilite[] = [1, 2, 3, 4, 5, 6, 0].map((jour) => ({
  jour,
  actif: jour >= 1 && jour <= 5,
  debut: '09:00',
  fin: '18:00',
}));

// Sans caractères ambigus (0/O, 1/I/L).
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export const genererCode = (): string => {
  const octets = crypto.getRandomValues(new Uint8Array(8));
  const c = Array.from(octets, (o) => ALPHABET[o % ALPHABET.length]).join('');
  return `${c.slice(0, 4)}-${c.slice(4)}`;
};

const slug = (nom: string): string =>
  nom.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'client';

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  readonly utilisateurs = signal<Utilisateur[]>(this.lire(CLES.utilisateurs, UTILISATEURS));
  readonly documents = signal<Document[]>(DOCUMENTS);
  readonly demandes = signal<Demande[]>(this.lire(CLES.demandes, []));
  readonly disponibilites = signal<Disponibilite[]>(this.lire(CLES.disponibilites, DISPONIBILITES));

  clients(): Utilisateur[] {
    return this.utilisateurs().filter((u) => u.role === 'client');
  }

  utilisateur(id: string): Utilisateur | undefined {
    return this.utilisateurs().find((u) => u.id === id);
  }

  documentsDe(clientId: string): Document[] {
    return this.documents().filter((d) => d.clientId === clientId);
  }

  demandesDe(clientId: string): Demande[] {
    return this.demandes().filter((d) => d.clientId === clientId);
  }

  // --- Clients (gérés par Youcef) ---

  ajouterClient(nom: string, solde: number): Utilisateur {
    const base = slug(nom);
    let identifiant = base;
    for (let i = 2; this.utilisateurs().some((u) => u.identifiant === identifiant); i++) identifiant = `${base}-${i}`;
    const client: Utilisateur = { id: crypto.randomUUID(), identifiant, code: genererCode(), nom: nom.trim(), role: 'client', solde };
    this.majUtilisateurs([...this.utilisateurs(), client]);
    return client;
  }

  supprimerClient(id: string): void {
    this.majUtilisateurs(this.utilisateurs().filter((u) => u.id !== id));
    this.documents.update((l) => l.filter((d) => d.clientId !== id));
    this.majDemandes(this.demandes().filter((d) => d.clientId !== id));
  }

  ajusterSolde(id: string, delta: number): void {
    this.majUtilisateurs(this.utilisateurs().map((u) => (u.id === id ? { ...u, solde: Math.max(0, u.solde + delta) } : u)));
  }

  regenererCode(id: string): void {
    this.majUtilisateurs(this.utilisateurs().map((u) => (u.id === id ? { ...u, code: genererCode() } : u)));
  }

  // --- Demandes de séance ---

  /** Séances encore réservables : le solde moins les demandes déjà en attente. */
  soldeDisponible(clientId: string): number {
    const enAttente = this.demandesDe(clientId).filter((d) => d.statut === 'en attente').length;
    return Math.max(0, (this.utilisateur(clientId)?.solde ?? 0) - enAttente);
  }

  ajouterDemande(clientId: string, debut: string, fin: string, message: string): void {
    const demande: Demande = {
      id: crypto.randomUUID(),
      clientId,
      debut,
      fin,
      message,
      date: new Date().toISOString().slice(0, 10),
      statut: 'en attente',
    };
    this.majDemandes([demande, ...this.demandes()]);
  }

  /** Accepte la demande et décompte une séance. Refuse si le solde du client est épuisé. */
  accepter(id: string): boolean {
    const demande = this.demandes().find((d) => d.id === id);
    const client = demande && this.utilisateur(demande.clientId);
    if (!demande || !client || client.solde < 1) return false;
    this.ajusterSolde(client.id, -1);
    this.majDemandes(this.demandes().map((d) => (d.id === id ? { ...d, statut: 'acceptée' } : d)));
    return true;
  }

  refuser(id: string): void {
    this.majDemandes(this.demandes().map((d) => (d.id === id ? { ...d, statut: 'refusée' } : d)));
  }

  // --- Disponibilités ---

  majDisponibilites(liste: Disponibilite[]): void {
    this.disponibilites.set(liste);
    this.ecrire(CLES.disponibilites, liste);
  }

  private majUtilisateurs(liste: Utilisateur[]): void {
    this.utilisateurs.set(liste);
    this.ecrire(CLES.utilisateurs, liste);
  }

  private majDemandes(liste: Demande[]): void {
    this.demandes.set(liste);
    this.ecrire(CLES.demandes, liste);
  }

  private ecrire(cle: string, valeur: unknown): void {
    if (this.navigateur) localStorage.setItem(cle, JSON.stringify(valeur));
  }

  private lire<T>(cle: string, defaut: T): T {
    if (!this.navigateur) return defaut;
    try {
      const brut = localStorage.getItem(cle);
      return brut ? JSON.parse(brut) : defaut;
    } catch {
      return defaut;
    }
  }
}
