import * as calendly from '../calendly';
import { Reponse, Requete, appelant, nonConfigure, supabaseAdmin } from './commun';

/**
 * Décompte du solde après une réservation. Le client ne décide pas lui-même : le serveur vérifie auprès de Calendly
 * qu'il existe des rendez-vous à son nom pas encore comptés, puis retire une séance par rendez-vous nouveau.
 */
export async function seance(req: Requete): Promise<Reponse> {
  const db = supabaseAdmin();
  if (!db) return nonConfigure();
  if (req.method !== 'POST') return { status: 405, corps: { erreur: 'Méthode non autorisée.' } };
  const moi = await appelant(req);
  if (!moi || moi.role !== 'client') return { status: 403, corps: { erreur: 'Accès réservé.' } };
  if (!calendly.configure()) return { status: 503, corps: { erreur: 'Calendly non configuré.' } };

  try {
    const siens = (await calendly.prochainsRdv(true)).filter((r) => r.clientId === moi.id);
    let decomptees = 0;
    for (const r of siens) {
      const { error } = await db.from('seances_comptees').insert({ event_id: r.id, client_id: moi.id });
      if (error) continue; // déjà comptée (clé primaire)
      const { data: profil } = await db.from('profiles').select('solde').eq('id', moi.id).single();
      await db.from('profiles').update({ solde: Math.max(0, (profil?.solde ?? 0) - 1) }).eq('id', moi.id);
      decomptees++;
    }
    return { status: 200, corps: { decomptees } };
  } catch (e) {
    console.error('Décompte de séance impossible', e);
    return { status: 502, corps: { erreur: 'Calendly indisponible.' } };
  }
}
