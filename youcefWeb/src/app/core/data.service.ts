import { Injectable, PLATFORM_ID, inject, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Demande, Document, StatutDemande } from './models';

const CLE = 'youcef-demandes';

// Données de démonstration, en attendant la base SQL.
const DOCUMENTS: Document[] = [
  { id: 'd1', clientId: 'u2', titre: 'Contrat d\'accompagnement', date: '2026-09-02' },
  { id: 'd2', clientId: 'u2', titre: 'Compte rendu - séance 1', date: '2026-09-09' },
  { id: 'd3', clientId: 'u2', titre: 'Exercices estime de soi', date: '2026-09-16' },
  { id: 'd4', clientId: 'u3', titre: 'Contrat d\'accompagnement', date: '2026-10-01' },
];

@Injectable({ providedIn: 'root' })
export class DataService {
  private readonly navigateur = isPlatformBrowser(inject(PLATFORM_ID));

  readonly documents = signal<Document[]>(DOCUMENTS);
  readonly demandes = signal<Demande[]>(this.charger());

  documentsDe(clientId: string): Document[] {
    return this.documents().filter((d) => d.clientId === clientId);
  }

  demandesDe(clientId: string): Demande[] {
    return this.demandes().filter((d) => d.clientId === clientId);
  }

  ajouterDemande(clientId: string, offre: string, message: string): void {
    const demande: Demande = {
      id: crypto.randomUUID(),
      clientId,
      offre,
      message,
      date: new Date().toISOString().slice(0, 10),
      statut: 'en attente',
    };
    this.maj([demande, ...this.demandes()]);
  }

  changerStatut(id: string, statut: StatutDemande): void {
    this.maj(this.demandes().map((d) => (d.id === id ? { ...d, statut } : d)));
  }

  private maj(liste: Demande[]): void {
    this.demandes.set(liste);
    if (this.navigateur) localStorage.setItem(CLE, JSON.stringify(liste));
  }

  private charger(): Demande[] {
    if (!this.navigateur) return [];
    try {
      return JSON.parse(localStorage.getItem(CLE) ?? '[]');
    } catch {
      return [];
    }
  }
}
