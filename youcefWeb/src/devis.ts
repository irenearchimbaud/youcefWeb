import nodemailer from 'nodemailer';

/** Envoi des demandes de devis par e-mail, partagé entre le serveur Express (src/server.ts) et la fonction Vercel (api/devis.ts). */

const echapper = (t: string): string =>
  t.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const texte = (v: unknown, max: number): string => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const dernierEnvoi = new Map<string, number>();

export interface ReponseDevis {
  status: number;
  corps: { ok?: true; erreur?: string };
}

export async function traiterDevis(body: unknown, ip: string): Promise<ReponseDevis> {
  const b = (body ?? {}) as Record<string, unknown>;
  const nom = texte(b['nom'], 100);
  const email = texte(b['email'], 150);
  const telephone = texte(b['telephone'], 30);
  const formule = texte(b['formule'], 100);
  const message = texte(b['message'], 3000);

  if (texte(b['siteWeb'], 100)) {
    // champ piège anti-robots
    return { status: 200, corps: { ok: true } };
  }
  if (!nom || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !message) {
    return { status: 400, corps: { erreur: 'Merci de renseigner votre nom, un e-mail valide et votre message.' } };
  }
  const maintenant = Date.now();
  if (maintenant - (dernierEnvoi.get(ip) ?? 0) < 30_000) {
    return { status: 429, corps: { erreur: 'Merci de patienter quelques secondes avant un nouvel envoi.' } };
  }
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, DEVIS_DESTINATAIRE } = process.env;
  if (!SMTP_HOST || !DEVIS_DESTINATAIRE) {
    console.error('SMTP_HOST ou DEVIS_DESTINATAIRE manquant : demande de devis non envoyée.');
    return { status: 503, corps: { erreur: "L'envoi n'est pas disponible pour le moment. Merci de réessayer plus tard." } };
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
    dernierEnvoi.set(ip, maintenant);
    return { status: 200, corps: { ok: true } };
  } catch (e) {
    console.error('Envoi de la demande de devis impossible', e);
    return { status: 502, corps: { erreur: "L'envoi a échoué. Merci de réessayer plus tard." } };
  }
}
