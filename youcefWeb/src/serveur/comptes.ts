import { createHash, randomUUID } from 'node:crypto';
import { ecrireJson, ecrireOctets, lireJson, lireOctets, lister, supprimer } from './stockage';
import { hacher } from './securite';

export interface Compte {
  id: string;
  nom: string;
  email: string;
  role: 'client' | 'pro';
  solde: number;
  /** Mot de passe haché (scrypt). Le mot de passe lui-même n'existe nulle part. */
  hash: string;
  /** Augmente à chaque changement de mot de passe : invalide les sessions et liens de réinitialisation en cours. */
  version: number;
  /** Vrai tant que le client n'a pas remplacé son code de première connexion. */
  doitChanger: boolean;
  echecs: number;
  bloqueJusqua: number;
  dernierOubli: number;
  creeLe: string;
}

/** Ce que le navigateur a le droit de voir (jamais le hash). */
export interface Comptepublic {
  id: string;
  nom: string;
  email: string;
  role: 'client' | 'pro';
  solde: number;
  doitChangerMdp: boolean;
}

export const versPublic = (c: Compte): Comptepublic => ({
  id: c.id,
  nom: c.nom,
  email: c.email,
  role: c.role,
  solde: c.solde,
  doitChangerMdp: c.doitChanger,
});

export const normaliserEmail = (e: string): string => e.trim().toLowerCase();
const cleEmail = (email: string): string => `emails/${createHash('sha256').update(normaliserEmail(email)).digest('hex')}`;
const cheminCompte = (id: string): string => `utilisateurs/${id}`;

const UUID = /^[0-9a-f-]{36}$/;
export const idValide = (id: unknown): id is string => typeof id === 'string' && UUID.test(id);

export const trouverParId = (id: string): Promise<Compte | null> => (idValide(id) ? lireJson<Compte>(cheminCompte(id)) : Promise.resolve(null));

export async function trouverParEmail(email: string): Promise<Compte | null> {
  const id = await lireOctets(cleEmail(email));
  return id ? trouverParId(id.toString('utf8')) : null;
}

export const enregistrer = (c: Compte): Promise<void> => ecrireJson(cheminCompte(c.id), c);

/** Crée un compte avec un mot de passe initial (code de première connexion). */
export async function creerCompte(donnees: { nom: string; email: string; role: Compte['role']; solde: number }, motDePasse: string): Promise<Compte> {
  const c: Compte = {
    id: randomUUID(),
    nom: donnees.nom,
    email: normaliserEmail(donnees.email),
    role: donnees.role,
    solde: donnees.solde,
    hash: await hacher(motDePasse),
    version: 1,
    doitChanger: true,
    echecs: 0,
    bloqueJusqua: 0,
    dernierOubli: 0,
    creeLe: new Date().toISOString(),
  };
  await enregistrer(c);
  await ecrireOctets(cleEmail(c.email), Buffer.from(c.id));
  return c;
}

export async function listerClients(): Promise<Compte[]> {
  const chemins = await lister('utilisateurs/');
  const comptes = await Promise.all(chemins.map((p) => lireJson<Compte>(p)));
  return comptes.filter((c): c is Compte => !!c && c.role === 'client').sort((a, b) => a.nom.localeCompare(b.nom));
}

export async function supprimerCompte(c: Compte): Promise<void> {
  await supprimer(cheminCompte(c.id));
  await supprimer(cleEmail(c.email));
}
