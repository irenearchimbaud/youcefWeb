import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Document, Utilisateur } from './models';
import { enregistrerFichier, lireFichier, supprimerFichier } from './fichiers';

const CLES = {
  utilisateurs: 'youcef-utilisateurs',
  documents: 'youcef-documents',
};

// Données de démonstration, en attendant la base SQL.
const UTILISATEURS: Utilisateur[] = [
  { id: 'u1', identifiant: 'youcef', code: 'pro123', nom: 'Youcef', role: 'pro', solde: 0 },
  { id: 'u2', identifiant: 'marie-dupont', code: 'K7M2-QX9P', nom: 'Marie Dupont', role: 'client', solde: 10 },
  { id: 'u3', identifiant: 'paul-martin', code: 'T4NR-8WHD', nom: 'Paul Martin', role: 'client', solde: 5 },
];

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
  readonly documents = signal<Document[]>(this.lire(CLES.documents, []));

  clients(): Utilisateur[] {
    return this.utilisateurs().filter((u) => u.role === 'client');
  }

  utilisateur(id: string): Utilisateur | undefined {
    return this.utilisateurs().find((u) => u.id === id);
  }

  documentsDe(clientId: string): Document[] {
    return this.documents().filter((d) => d.clientId === clientId);
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
    this.documentsDe(id).forEach((d) => void supprimerFichier(d.id).catch(() => {}));
    this.majDocuments(this.documents().filter((d) => d.clientId !== id));
  }

  // --- Documents ---

  async ajouterDocument(clientId: string, titre: string, fichier: File): Promise<Document> {
    const doc: Document = {
      id: crypto.randomUUID(),
      clientId,
      titre: titre.trim() || fichier.name,
      date: new Date().toISOString().slice(0, 10),
      fichier: fichier.name,
      type: fichier.type || 'application/octet-stream',
      taille: fichier.size,
    };
    await enregistrerFichier(doc.id, fichier);
    this.majDocuments([...this.documents(), doc]);
    return doc;
  }

  async supprimerDocument(id: string): Promise<void> {
    await supprimerFichier(id);
    this.majDocuments(this.documents().filter((d) => d.id !== id));
  }

  contenuDocument(id: string): Promise<Blob | undefined> {
    return lireFichier(id);
  }

  /** Ouvre le document dans un nouvel onglet (à appeler directement depuis le clic, sinon le navigateur bloque la fenêtre). */
  async visualiser(doc: Document): Promise<boolean> {
    const fenetre = window.open('', '_blank');
    const blob = await lireFichier(doc.id);
    if (!blob) {
      fenetre?.close();
      return false;
    }
    const url = URL.createObjectURL(new Blob([blob], { type: doc.type }));
    if (fenetre) fenetre.location.href = url;
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return true;
  }

  async telecharger(doc: Document): Promise<boolean> {
    const blob = await lireFichier(doc.id);
    if (!blob) return false;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.fichier;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return true;
  }

  ajusterSolde(id: string, delta: number): void {
    this.definirSolde(id, (this.utilisateur(id)?.solde ?? 0) + delta);
  }

  definirSolde(id: string, solde: number): void {
    const valeur = Math.max(0, Math.floor(solde));
    this.majUtilisateurs(this.utilisateurs().map((u) => (u.id === id ? { ...u, solde: valeur } : u)));
  }

  regenererCode(id: string): void {
    this.majUtilisateurs(this.utilisateurs().map((u) => (u.id === id ? { ...u, code: genererCode() } : u)));
  }

  /** Décompte une séance du solde (appelé quand le client vient de réserver via Calendly). */
  consommerSeance(clientId: string): void {
    this.ajusterSolde(clientId, -1);
  }

  private majDocuments(liste: Document[]): void {
    this.documents.set(liste);
    this.ecrire(CLES.documents, liste);
  }

  private majUtilisateurs(liste: Utilisateur[]): void {
    this.utilisateurs.set(liste);
    this.ecrire(CLES.utilisateurs, liste);
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
