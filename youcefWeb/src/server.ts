import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { envoyerMail } from './mail';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api', express.json({ limit: '10kb' }));

/**
 * Une demande de rendez-vous déposée par un client est transmise par mail à Youcef.
 */
app.post('/api/demandes', async (req, res) => {
  const { nom, offre, message } = req.body ?? {};
  const valide = (v: unknown, max: number): v is string =>
    typeof v === 'string' && v.trim().length > 0 && v.length <= max;

  if (!valide(nom, 100) || !valide(offre, 100) || !valide(message, 2000)) {
    res.status(400).json({ erreur: 'Demande invalide.' });
    return;
  }

  try {
    await envoyerMail({
      to: process.env['MAIL_TO'] ?? 'youcef@example.com',
      subject: `Nouvelle demande de rendez-vous : ${nom.trim()}`,
      text: `${nom.trim()} souhaite un rendez-vous.\n\nAccompagnement : ${offre}\n\n${message.trim()}`,
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error('Échec de l\'envoi du mail', e);
    res.status(502).json({ erreur: 'Le mail n\'a pas pu être envoyé.' });
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
