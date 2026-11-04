import { Reponse, Requete, appelant, genererCode, nonConfigure, supabaseAdmin, texte } from './commun';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Gestion des comptes clients, réservée à Youcef :
 *  POST   { nom, email, solde }       crée le compte et renvoie le code de première connexion (affiché une seule fois)
 *  PATCH  { id }                      génère un nouveau code (l'ancien mot de passe est invalidé)
 *  DELETE ?id=…                       supprime le client, son compte et ses documents
 * Le mot de passe du client n'est jamais stocké ni lisible : seul le code de première connexion existe, et il est remplacé
 * par le choix du client.
 */
export async function clients(req: Requete): Promise<Reponse> {
  const db = supabaseAdmin();
  if (!db) return nonConfigure();
  const moi = await appelant(req);
  if (!moi) return { status: 401, corps: { erreur: 'Connexion requise.' } };
  if (moi.role !== 'pro') return { status: 403, corps: { erreur: 'Accès réservé.' } };

  const b = (req.body ?? {}) as Record<string, unknown>;

  if (req.method === 'POST') {
    const nom = texte(b['nom'], 100);
    const email = texte(b['email'], 150).toLowerCase();
    const solde = Number(b['solde']);
    if (!nom || !EMAIL.test(email) || !Number.isInteger(solde) || solde < 0 || solde > 500) {
      return { status: 400, corps: { erreur: 'Nom, e-mail valide et nombre de séances (0 à 500) requis.' } };
    }
    const code = genererCode();
    const { data, error } = await db.auth.admin.createUser({ email, password: code, email_confirm: true });
    if (error || !data.user) {
      const existe = /already|registered|exists/i.test(error?.message ?? '');
      return { status: existe ? 409 : 502, corps: { erreur: existe ? 'Un compte existe déjà avec cet e-mail.' : 'Création du compte impossible.' } };
    }
    const client = { id: data.user.id, nom, email, role: 'client', solde, doit_changer_mdp: true };
    const { error: errProfil } = await db.from('profiles').insert(client);
    if (errProfil) {
      await db.auth.admin.deleteUser(data.user.id);
      console.error('Création du profil impossible', errProfil);
      return { status: 502, corps: { erreur: 'Création du compte impossible.' } };
    }
    return { status: 201, corps: { client, code } };
  }

  const id = texte(req.query['id'] ?? b['id'], 64);
  const { data: cible } = await db.from('profiles').select('id, role').eq('id', id).maybeSingle();
  if (!cible || cible.role !== 'client') return { status: 404, corps: { erreur: 'Client introuvable.' } };

  if (req.method === 'PATCH') {
    const code = genererCode();
    const { error } = await db.auth.admin.updateUserById(id, { password: code });
    if (error) return { status: 502, corps: { erreur: 'Impossible de générer un nouveau code.' } };
    await db.from('profiles').update({ doit_changer_mdp: true }).eq('id', id);
    return { status: 200, corps: { code } };
  }

  if (req.method === 'DELETE') {
    const { data: fichiers } = await db.storage.from('documents').list(id);
    if (fichiers?.length) await db.storage.from('documents').remove(fichiers.map((f) => `${id}/${f.name}`));
    const { error } = await db.auth.admin.deleteUser(id);
    if (error) return { status: 502, corps: { erreur: 'Suppression impossible.' } };
    return { status: 200, corps: { ok: true } };
  }

  return { status: 405, corps: { erreur: 'Méthode non autorisée.' } };
}
