import { clients } from '../src/serveur/clients';
import { versVercel } from '../src/serveur/vercel';

/** Équivalent Vercel de la route Express /api/clients de src/server.ts. */
export default versVercel(clients);
