import { Reponse, Requete, corpsJson, erreur, reponse, texte } from './commun';
import { creerCompte, enregistrer, idValide, listerClients, supprimerCompte, trouverParEmail, trouverParId, versPublic } from './comptes';
import { supprimerDocumentsDe } from './documents';
import { genererCode, hacher } from './securite';
import { appelant } from './session';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Gestion des comptes clients, réservée à Youcef :
 *  GET                                  liste des clients
 *  POST   { nom, email, solde }         crée le compte et renvoie le code de première connexion (affiché une seule fois)
 *  PATCH  { id, action:'code' }         génère un nouveau code (l'ancien mot de passe est invalidé)
 *  PATCH  { id, solde }                 fixe le nombre de séances
 *  DELETE ?id=…                         supprime le client, son compte et ses documents
 * Le mot de passe du client n'est jamais lisible : seul le code de première connexion existe, et il est remplacé par son choix.
 */
export async function clients(req: Requete): Promise<Reponse> {
  const moi = await appelant(req);
  if (!moi) return erreur(401, 'Connexion requise.');
  if (moi.role !== 'pro') return erreur(403, 'Accès réservé.');

  if (req.method === 'GET') return reponse(200, { clients: (await listerClients()).map(versPublic) });

  const b = corpsJson(req);

  if (req.method === 'POST') {
    const nom = texte(b['nom'], 100);
    const email = texte(b['email'], 150).toLowerCase();
    const solde = Number(b['solde']);
    if (!nom || !EMAIL.test(email) || !Number.isInteger(solde) || solde < 0 || solde > 500) {
      return erreur(400, 'Nom, e-mail valide et nombre de séances (0 à 500) requis.');
    }
    if (await trouverParEmail(email)) return erreur(409, 'Un compte existe déjà avec cet e-mail.');
    const code = genererCode();
    const client = await creerCompte({ nom, email, role: 'client', solde }, code);
    return reponse(201, { client: versPublic(client), code });
  }

  const id = texte(req.query['id'] ?? b['id'], 64);
  const cible = idValide(id) ? await trouverParId(id) : null;
  if (!cible || cible.role !== 'client') return erreur(404, 'Client introuvable.');

  if (req.method === 'PATCH') {
    if (b['action'] === 'code') {
      const code = genererCode();
      cible.hash = await hacher(code);
      cible.version += 1;
      cible.doitChanger = true;
      cible.echecs = 0;
      cible.bloqueJusqua = 0;
      await enregistrer(cible);
      return reponse(200, { code });
    }
    const solde = Number(b['solde']);
    if (!Number.isInteger(solde) || solde < 0 || solde > 500) return erreur(400, 'Nombre de séances invalide.');
    cible.solde = solde;
    await enregistrer(cible);
    return reponse(200, { client: versPublic(cible) });
  }

  if (req.method === 'DELETE') {
    await supprimerDocumentsDe(cible.id);
    await supprimerCompte(cible);
    return reponse(200, { ok: true });
  }

  return erreur(405, 'Méthode non autorisée.');
}
