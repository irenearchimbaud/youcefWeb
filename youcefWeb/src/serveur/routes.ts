import { auth } from './auth';
import { clients } from './clients';
import { Reponse, Requete, erreur, origineValide } from './commun';
import { documents } from './documents';
import { rdv } from './rdv';
import { ErreurConfig } from './securite';
import { seance } from './seance';

type Gestionnaire = (r: Requete) => Promise<Reponse>;

/** Ajoute à chaque route la vérification d'origine (CSRF) et une gestion d'erreur qui ne divulgue aucun détail. */
const garde =
  (g: Gestionnaire): Gestionnaire =>
  async (req) => {
    if (!origineValide(req)) return erreur(403, 'Origine non autorisée.');
    try {
      return await g(req);
    } catch (e) {
      console.error('Erreur serveur', e);
      return e instanceof ErreurConfig ? erreur(503, "Le serveur n'est pas configuré.") : erreur(500, 'Erreur du serveur.');
    }
  };

export const routes = {
  auth: garde(auth),
  clients: garde(clients),
  documents: garde(documents),
  rdv: garde(rdv),
  seance: garde(seance),
};
