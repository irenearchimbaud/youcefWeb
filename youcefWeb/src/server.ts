import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { Reponse, Requete } from './serveur/commun';
import { routes } from './serveur/routes';
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

app.use('/api', express.json({ limit: '10kb' }), express.raw({ type: 'application/octet-stream', limit: '5mb' }));

/** Routes du site (comptes, clients, documents, rendez-vous) : voir src/serveur. Sur Vercel, ce sont les fonctions de api/. */
const route = (h: (r: Requete) => Promise<Reponse>) => async (req: express.Request, res: express.Response) => {
  const r = await h({ method: req.method, headers: req.headers, body: req.body, query: req.query });
  for (const [k, v] of Object.entries(r.entetes ?? {})) res.setHeader(k, v);
  if (r.binaire) res.status(r.status).send(r.binaire);
  else res.status(r.status).json(r.corps ?? {});
};
app.all('/api/auth', route(routes.auth));
app.all('/api/clients', route(routes.clients));
app.all('/api/documents', route(routes.documents));
app.get('/api/rdv', route(routes.rdv));
app.post('/api/seance', route(routes.seance));

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
