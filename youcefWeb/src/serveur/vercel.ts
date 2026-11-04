import { Reponse, Requete } from './commun';

/** Adapte un gestionnaire indépendant de l'hébergeur en fonction Vercel (api/*.ts). */
export const versVercel =
  (gestionnaire: (r: Requete) => Promise<Reponse>) =>
  async (req: any, res: any): Promise<void> => {
    const r = await gestionnaire({ method: req.method, headers: req.headers, body: req.body, query: req.query });
    res.status(r.status).json(r.corps);
  };
