import * as calendly from '../calendly';
import { Reponse, Requete, erreur, reponse } from './commun';
import { enregistrer, trouverParId } from './comptes';
import { appelant } from './session';
import { ecrireOctets, existe } from './stockage';

/**
 * Décompte du solde après une réservation. Le client ne décide pas lui-même : le serveur vérifie auprès de Calendly
 * qu'il existe des rendez-vous à son nom pas encore comptés, puis retire une séance par rendez-vous nouveau.
 */
export async function seance(req: Requete): Promise<Reponse> {
  if (req.method !== 'POST') return erreur(405, 'Méthode non autorisée.');
  const moi = await appelant(req);
  if (!moi || moi.role !== 'client') return erreur(403, 'Accès réservé.');
  if (!calendly.configure()) return erreur(503, 'Calendly non configuré.');

  try {
    const siens = (await calendly.prochainsRdv(true)).filter((r) => r.clientId === moi.id);
    let decomptees = 0;
    for (const r of siens) {
      const marque = `seances/${moi.id}/${r.id.replace(/[^\w-]/g, '_')}`;
      if (await existe(marque)) continue; // déjà comptée
      await ecrireOctets(marque, Buffer.from('1'));
      const compte = await trouverParId(moi.id);
      if (!compte) break;
      compte.solde = Math.max(0, compte.solde - 1);
      await enregistrer(compte);
      decomptees++;
    }
    return reponse(200, { decomptees });
  } catch (e) {
    console.error('Décompte de séance impossible', e);
    return erreur(502, 'Calendly indisponible.');
  }
}
