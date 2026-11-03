import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import { envoyerMail } from './mail';
import * as google from './google';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use('/api', express.json({ limit: '10kb' }));

const valide = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.trim().length > 0 && v.length <= max;

const dateIso = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(Date.parse(v));

const formaterDate = (iso: string): string =>
  new Date(iso).toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'short', timeZone: 'Europe/Paris' });

const urlRetour = (req: express.Request): string =>
  process.env['GOOGLE_REDIRECT_URI'] ?? `${req.protocol}://${req.get('host')}/api/google/callback`;

/**
 * Une demande de séance déposée par un client est transmise par mail à Youcef.
 */
app.post('/api/demandes', async (req, res) => {
  const { nom, debut, message } = req.body ?? {};

  if (!valide(nom, 100) || !dateIso(debut) || (message !== undefined && typeof message !== 'string') || (message ?? '').length > 2000) {
    res.status(400).json({ erreur: 'Demande invalide.' });
    return;
  }

  try {
    await envoyerMail({
      to: process.env['MAIL_TO'] ?? 'youcef@example.com',
      subject: `Nouvelle demande de séance : ${nom.trim()}`,
      text: `${nom.trim()} demande une séance le ${formaterDate(debut)}.

${(message ?? '').trim() || '(sans message)'}`,
    });
    res.status(201).json({ ok: true });
  } catch (e) {
    console.error("Échec de l'envoi du mail", e);
    res.status(502).json({ erreur: "Le mail n'a pas pu être envoyé." });
  }
});

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

app.get('/api/google/occupe', async (req, res) => {
  const { debut, fin } = req.query;
  if (!dateIso(debut) || !dateIso(fin) || Date.parse(fin) - Date.parse(debut) > 93 * 86_400_000) {
    res.status(400).json({ erreur: 'Période invalide.' });
    return;
  }
  if (!(await google.connecte())) {
    res.json({ connecte: false, occupe: [] });
    return;
  }
  try {
    res.json({ connecte: true, occupe: await google.plagesOccupees(debut, fin) });
  } catch (e) {
    console.error("Lecture de l'agenda impossible", e);
    res.status(502).json({ erreur: 'Agenda indisponible.' });
  }
});

app.post('/api/google/evenement', async (req, res) => {
  const { debut, fin, client } = req.body ?? {};
  if (!dateIso(debut) || !dateIso(fin) || Date.parse(fin) <= Date.parse(debut) || !valide(client, 100)) {
    res.status(400).json({ erreur: 'Séance invalide.' });
    return;
  }
  if (!(await google.connecte())) {
    res.status(409).json({ erreur: "Google Agenda n'est pas connecté." });
    return;
  }
  try {
    res.status(201).json(await google.creerEvenement({ debut, fin, client: client.trim() }));
  } catch (e) {
    console.error("Création de l'événement impossible", e);
    res.status(502).json({ erreur: "L'événement n'a pas pu être créé." });
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
