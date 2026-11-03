import * as calendly from '../src/calendly';

/** Équivalent Vercel de la route Express GET /api/rdv de src/server.ts. */
export default async function handler(req: any, res: any): Promise<void> {
  if (!calendly.configure()) {
    res.status(200).json({ configure: false, rdv: [] });
    return;
  }
  try {
    const { client, frais } = req.query;
    const rdv = await calendly.prochainsRdv(frais === '1');
    res.status(200).json({ configure: true, rdv: typeof client === 'string' ? rdv.filter((r) => r.clientId === client) : rdv });
  } catch (e) {
    console.error('Lecture de Calendly impossible', e);
    res.status(502).json({ erreur: 'Calendly indisponible.' });
  }
}
