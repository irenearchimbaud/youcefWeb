import { traiterDevis } from '../src/devis';

/** Équivalent Vercel de la route Express POST /api/devis de src/server.ts. */
export default async function handler(req: any, res: any): Promise<void> {
  if (req.method !== 'POST') {
    res.status(405).json({ erreur: 'Méthode non autorisée.' });
    return;
  }
  const ip = String(req.headers['x-forwarded-for'] ?? '').split(',')[0].trim();
  const r = await traiterDevis(req.body, ip);
  res.status(r.status).json(r.corps);
}
