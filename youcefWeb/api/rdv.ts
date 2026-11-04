import { rdv } from '../src/serveur/rdv';
import { versVercel } from '../src/serveur/vercel';

/** Équivalent Vercel de la route Express GET /api/rdv de src/server.ts. */
export default versVercel(rdv);
