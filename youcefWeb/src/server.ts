import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { clients } from './serveur/clients';
import { Reponse, Requete } from './serveur/commun';
import { rdv } from './serveur/rdv';
import { seance } from './serveur/seance';
import { traiterDevis } from './devis';

// Charge le fichier .env (jeton Calendly) s'il existe.
try {
  process.loadEnvFile();
} catch (e) {
  if ((e as NodeJS.ErrnoException).code === 'ENOENT') {
    console.warn(`Aucun fichier .env trouvé dans ${process.cwd()} : copiez .env.example en .env.`);
  } else {
    console.warn('Lecture du fichier .env impossible (Node ≥ 20.12 requis) :', e);
  }
}
if (!process.env['CALENDLY_TOKEN']) {
  console.warn('CALENDLY_TOKEN est vide : les rendez-vous Calendly ne seront pas affichés.');
}

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api', express.json({ limit: '10kb' }));

/** Routes protégées par la session Supabase (voir src/serveur). Sur Vercel, ce sont les fonctions de api/. */
const route = (h: (r: Requete) => Promise<Reponse>) => async (req: express.Request, res: express.Response) => {
  const r = await h({ method: req.method, headers: req.headers, body: req.body, query: req.query });
  res.status(r.status).json(r.corps);
};
app.get('/api/rdv', route(rdv));
app.post('/api/seance', route(seance));
app.all('/api/clients', route(clients));

/**
 * Demande de devis : envoie les informations du prospect par e-mail à Youcef,
 * qui crée ensuite son compte dans l'espace membre.
 */
app.post('/api/devis', async (req, res) => {
  const r = await traiterDevis(req.body, req.ip ?? '');
  res.status(r.status).json(r.corps);
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
