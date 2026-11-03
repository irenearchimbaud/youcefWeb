import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import * as google from './google';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api', express.json({ limit: '10kb' }));

const urlRetour = (req: express.Request): string =>
  process.env['GOOGLE_REDIRECT_URI'] ?? `${req.protocol}://${req.get('host')}/api/google/callback`;

/**
 * Google Agenda de Youcef : connexion OAuth, plages occupées et création des séances.
 */
app.get('/api/google/statut', async (_req, res) => {
  res.json({ configure: google.configure(), connecte: await google.connecte() });
});

app.get('/api/google/connexion', (req, res) => {
  if (!google.configure()) {
    res.status(503).send('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET non définis.');
    return;
  }
  res.redirect(google.urlConnexion(urlRetour(req)));
});

app.get('/api/google/callback', async (req, res) => {
  const { code, state } = req.query;
  try {
    if (typeof code !== 'string' || typeof state !== 'string') throw new Error('Paramètres manquants');
    await google.finaliserConnexion(code, state, urlRetour(req));
    res.redirect('/espace-pro?google=ok');
  } catch (e) {
    console.error('Échec de la connexion Google', e);
    res.redirect('/espace-pro?google=erreur');
  }
});

app.post('/api/google/deconnexion', async (_req, res) => {
  await google.deconnecter();
  res.json({ ok: true });
});

app.get('/api/google/rdv', async (_req, res) => {
  if (!(await google.connecte())) {
    res.json({ connecte: false, rdv: [] });
    return;
  }
  try {
    res.json({ connecte: true, rdv: await google.prochainsRdv() });
  } catch (e) {
    console.error("Lecture de l'agenda impossible", e);
    res.status(502).json({ erreur: 'Agenda indisponible.' });
  }
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
