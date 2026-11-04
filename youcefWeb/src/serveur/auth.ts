import { Reponse, Requete, corpsJson, erreur, reponse, texte } from './commun';
import { Compte, creerCompte, enregistrer, normaliserEmail, trouverParEmail, trouverParId, versPublic } from './comptes';
import { envoyerMail } from './mail';
import { genererCode, hacher, signer, verifier, verifierMotDePasse } from './securite';
import { appelant, fermerSession, ouvrirSession } from './session';

const LONGUEUR_MIN = 10;
const ESSAIS_MAX = 5;
const BLOCAGE_MS = 15 * 60_000;
const DELAI_OUBLI_MS = 60_000;
const VALIDITE_LIEN = 3600;

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Hash factice : un e-mail inconnu coûte autant de temps qu'un e-mail connu (pas de détection des comptes par la durée).
let factice: Promise<string> | undefined;

const motDePasseValide = (m: unknown): m is string => typeof m === 'string' && m.length >= LONGUEUR_MIN && m.length <= 200;

/**
 *  GET                                       compte connecté (ou null)
 *  POST {action:'connexion', email, motDePasse}
 *  POST {action:'deconnexion'}
 *  POST {action:'oubli', email}              envoie un lien de réinitialisation (réponse identique si l'adresse est inconnue)
 *  POST {action:'reinit', jeton, motDePasse} choisit un nouveau mot de passe grâce au lien reçu par e-mail
 *  POST {action:'changer', motDePasse, ancien?}  change le mot de passe d'une personne connectée
 */
export async function auth(req: Requete): Promise<Reponse> {
  if (req.method === 'GET') {
    const moi = await appelant(req);
    return reponse(200, { utilisateur: moi ? versPublic(moi) : null });
  }
  if (req.method !== 'POST') return erreur(405, 'Méthode non autorisée.');

  const b = corpsJson(req);
  switch (b['action']) {
    case 'connexion':
      return connexion(req, texte(b['email'], 150), typeof b['motDePasse'] === 'string' ? b['motDePasse'].slice(0, 200) : '');
    case 'deconnexion':
      return reponse(200, { ok: true }, fermerSession(req));
    case 'oubli':
      return oubli(texte(b['email'], 150));
    case 'reinit':
      return reinit(req, texte(b['jeton'], 2000), b['motDePasse']);
    case 'changer':
      return changer(req, b['motDePasse'], b['ancien']);
    default:
      return erreur(400, 'Action inconnue.');
  }
}

async function connexion(req: Requete, email: string, motDePasse: string): Promise<Reponse> {
  const compte = await trouverParEmail(email);
  if (!compte) {
    await verifierMotDePasse(motDePasse, await (factice ??= hacher('inutilise')));
    return erreur(401, 'identifiants');
  }
  if (compte.bloqueJusqua > Date.now()) return erreur(429, 'bloque');

  if (!(await verifierMotDePasse(motDePasse, compte.hash))) {
    compte.echecs += 1;
    if (compte.echecs >= ESSAIS_MAX) {
      compte.bloqueJusqua = Date.now() + BLOCAGE_MS;
      compte.echecs = 0;
    }
    await enregistrer(compte);
    return erreur(401, 'identifiants');
  }
  if (compte.echecs || compte.bloqueJusqua) {
    compte.echecs = 0;
    compte.bloqueJusqua = 0;
    await enregistrer(compte);
  }
  return reponse(200, { utilisateur: versPublic(compte) }, ouvrirSession(req, compte));
}

/** Pour Youcef (PRO_EMAIL), le compte est créé au premier « mot de passe oublié » : aucun mot de passe n'est écrit dans le code. */
async function oubli(email: string): Promise<Reponse> {
  const generique = reponse(200, { ok: true });
  if (!EMAIL.test(email)) return generique;

  let compte = await trouverParEmail(email);
  const emailPro = normaliserEmail(process.env['PRO_EMAIL'] ?? '');
  if (!compte && emailPro && normaliserEmail(email) === emailPro) {
    compte = await creerCompte({ nom: 'Youcef Tahri', email: emailPro, role: 'pro', solde: 0 }, genererCode() + genererCode());
  }
  if (!compte || Date.now() - compte.dernierOubli < DELAI_OUBLI_MS) return generique;

  const site = (process.env['SITE_URL'] ?? '').replace(/\/$/, '');
  if (!site) {
    console.error('SITE_URL manquant : lien de réinitialisation non envoyé.');
    return generique;
  }
  compte.dernierOubli = Date.now();
  await enregistrer(compte);

  const jeton = signer({ t: 'reinit', id: compte.id, v: compte.version }, VALIDITE_LIEN);
  const lien = `${site}/nouveau-mot-de-passe?jeton=${encodeURIComponent(jeton)}`;
  try {
    await envoyerMail({
      to: compte.email,
      sujet: 'Réinitialisation de votre mot de passe',
      texte: `Bonjour,\n\nPour choisir un nouveau mot de passe, ouvrez ce lien (valable 1 heure, utilisable une seule fois) :\n${lien}\n\nSi vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.`,
      html: `<p>Bonjour,</p><p>Pour choisir un nouveau mot de passe, <a href="${lien}">cliquez ici</a> (lien valable 1 heure, utilisable une seule fois).</p><p>Si vous n'êtes pas à l'origine de cette demande, ignorez ce message : votre mot de passe reste inchangé.</p>`,
    });
  } catch (e) {
    console.error('Envoi du lien de réinitialisation impossible', e);
  }
  return generique;
}

async function reinit(req: Requete, jeton: string, motDePasse: unknown): Promise<Reponse> {
  if (!motDePasseValide(motDePasse)) return erreur(400, 'court');
  const charge = verifier<{ t: string; id: string; v: number }>(jeton);
  const compte = charge && charge.t === 'reinit' ? await trouverParId(charge.id) : null;
  if (!compte || compte.version !== charge!.v) return erreur(400, 'lien');
  return nouveauMotDePasse(req, compte, motDePasse);
}

async function changer(req: Requete, motDePasse: unknown, ancien: unknown): Promise<Reponse> {
  const moi = await appelant(req);
  if (!moi) return erreur(401, 'Connexion requise.');
  if (!motDePasseValide(motDePasse)) return erreur(400, 'court');
  // À la première connexion, la personne vient de s'authentifier avec son code : pas besoin de le ressaisir.
  if (!moi.doitChanger && !(typeof ancien === 'string' && (await verifierMotDePasse(ancien, moi.hash)))) return erreur(403, 'ancien');
  return nouveauMotDePasse(req, moi, motDePasse);
}

async function nouveauMotDePasse(req: Requete, compte: Compte, motDePasse: string): Promise<Reponse> {
  if (await verifierMotDePasse(motDePasse, compte.hash)) return erreur(400, 'identique');
  compte.hash = await hacher(motDePasse);
  compte.version += 1; // coupe les autres sessions et rend le lien de réinitialisation inutilisable
  compte.doitChanger = false;
  compte.echecs = 0;
  compte.bloqueJusqua = 0;
  await enregistrer(compte);
  return reponse(200, { utilisateur: versPublic(compte) }, ouvrirSession(req, compte));
}
