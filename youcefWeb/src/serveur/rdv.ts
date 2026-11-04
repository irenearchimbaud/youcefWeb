import * as calendly from '../calendly';
import { Reponse, Requete, erreur, reponse } from './commun';
import { appelant } from './session';

/**
 * Rendez-vous Calendly à venir. Youcef voit tous les rendez-vous (ou ceux d'un client avec ?client=) ;
 * un client ne voit que les siens, quel que soit le paramètre.
 */
export async function rdv(req: Requete): Promise<Reponse> {
  const moi = await appelant(req);
  if (!moi) return erreur(401, 'Connexion requise.');
  if (!calendly.configure()) return reponse(200, { configure: false, rdv: [] });
  try {
    const liste = await calendly.prochainsRdv(req.query['frais'] === '1');
    const demande = typeof req.query['client'] === 'string' ? req.query['client'] : undefined;
    const filtre = moi.role === 'client' ? moi.id : demande;
    return reponse(200, { configure: true, rdv: filtre ? liste.filter((r) => r.clientId === filtre) : liste });
  } catch (e) {
    console.error('Lecture de Calendly impossible', e);
    return erreur(502, 'Calendly indisponible.');
  }
}
