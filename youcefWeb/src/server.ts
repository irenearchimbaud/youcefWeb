import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import { join } from 'node:path';
import nodemailer from 'nodemailer';
import * as calendly from './calendly';

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

const echapper = (t: string): string =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const texte = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dernierEnvoi = new Map<string, number>();

/**
 * Demande de devis : envoie les informations du prospect par e-mail à Youcef,
 * qui crée ensuite son compte dans l'espace membre.
 */
app.post('/api/devis', async (req, res) => {
  const b = req.body ?? {};
  const nom = texte(b.nom, 100);
  const email = texte(b.email, 150);
  const telephone = texte(b.telephone, 30);
  const formule = texte(b.formule, 100);
  const message = texte(b.message, 3000);

  if (texte(b.siteWeb, 100)) {
    // champ piège anti-robots
    res.json({ ok: true });
    return;
  }
  if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    res.status(400).json({ erreur: 'Merci de renseigner votre nom, un e-mail valide et votre message.' });
    return;
  }
  const maintenant = Date.now();
  if (maintenant - (dernierEnvoi.get(req.ip ?? '') ?? 0) < 30_000) {
    res.status(429).json({ erreur: 'Merci de patienter quelques secondes avant un nouvel envoi.' });
    return;
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DEVIS_DESTINATAIRE } = process.env;
  if (!SMTP_HOST || !DEVIS_DESTINATAIRE) {
    console.error('SMTP_HOST ou DEVIS_DESTINATAIRE manquant : demande de devis non envoyée.');
    res.status(503).json({ erreur: "L'envoi n'est pas disponible pour le moment. Merci de réessayer plus tard." });
    return;
  }
  try {
    const transport = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT) || 587,
      secure: Number(SMTP_PORT) === 465,
      auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
    });
    await transport.sendMail({
      from: process.env['DEVIS_EXPEDITEUR'] || SMTP_USER || DEVIS_DESTINATAIRE,
      to: DEVIS_DESTINATAIRE,
      replyTo: { name: nom.replace(/[\r\n"<>]/g, ' '), address: email },
      subject: `Demande de devis – ${nom.replace(/[\r\n]/g, ' ')}`,
      text: `Nom : ${nom}\nE-mail : ${email}\nTéléphone : ${telephone || '—'}\nFormule : ${formule || '—'}\n\n${message}`,
      html: `<h2>Nouvelle demande de devis</h2>
<p><strong>Nom :</strong> ${echapper(nom)}<br><strong>E-mail :</strong> ${echapper(email)}<br>
<strong>Téléphone :</strong> ${echapper(telephone) || '—'}<br><strong>Formule :</strong> ${echapper(formule) || '—'}</p>
<p>${echapper(message).replace(/\n/g, '<br>')}</p>`,
    });
    dernierEnvoi.set(req.ip ?? '', maintenant);
    res.json({ ok: true });
  } catch (e) {
    console.error('Envoi de la demande de devis impossible', e);
    res.status(502).json({ erreur: "L'envoi a échoué. Merci de réessayer plus tard." });
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
