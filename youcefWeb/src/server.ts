import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import * as calendly from './calendly';
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

/**
 * Rendez-vous Calendly à venir. `?client=<id>` limite la liste à un client.
 * NB : l'authentification du site étant encore une démonstration côté navigateur, cette route n'est pas protégée.
 */
app.get('/api/rdv', async (req, res) => {
  if (!calendly.configure()) {
    res.json({ configure: false, rdv: [] });
    return;
  }
  try {
    const { client, frais } = req.query;
    const rdv = await calendly.prochainsRdv(frais === '1');
    res.json({ configure: true, rdv: typeof client === 'string' ? rdv.filter((r) => r.clientId === client) : rdv });
  } catch (e) {
    console.error('Lecture de Calendly impossible', e);
    res.status(502).json({ erreur: 'Calendly indisponible.' });
  }
});

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
