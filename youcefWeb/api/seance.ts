import { seance } from '../src/serveur/seance';
import { versVercel } from '../src/serveur/vercel';

/** Équivalent Vercel de la route Express POST /api/seance de src/server.ts. */
export default versVercel(seance);
