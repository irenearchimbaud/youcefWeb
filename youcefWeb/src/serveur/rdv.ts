import * as calendly from '../calendly';
import { Reponse, Requete, appelant, nonConfigure, supabaseAdmin } from './commun';

/**
 * Rendez-vous Calendly à venir. Youcef voit tous les rendez-vous (ou ceux d'un client avec ?client=) ;
 * un client ne voit que les siens, quel que soit le paramètre.
 */
export async function rdv(req: Requete): Promise<Reponse> {
  if (!supabaseAdmin()) return nonConfigure();
  const moi = await appelant(req);
  if (!moi) return { status: 401, corps: { erreur: 'Connexion requise.' } };
  if (!calendly.configure()) return { status: 200, corps: { configure: false, rdv: [] } };
  try {
    const liste = await calendly.prochainsRdv(req.query['frais'] === '1');
    const demande = typeof req.query['client'] === 'string' ? req.query['client'] : undefined;
    const filtre = moi.role === 'client' ? moi.id : demande;
    return { status: 200, corps: { configure: true, rdv: filtre ? liste.filter((r) => r.clientId === filtre) : liste } };
  } catch (e) {
    console.error('Lecture de Calendly impossible', e);
    const code = /^Calendly (\d{3})/.exec(String((e as Error)?.message))?.[1] ?? 'inconnu';
    return { status: 502, corps: { erreur: 'Calendly indisponible.', code } };
  }
}
