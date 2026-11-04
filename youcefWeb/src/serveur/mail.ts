import nodemailer from 'nodemailer';

/** Envoi d'un e-mail par le serveur SMTP configuré (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). */
export async function envoyerMail(a: { to: string; sujet: string; texte: string; html: string }): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST) throw new Error('SMTP_HOST manquant.');
  const transport = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT) || 587,
    secure: Number(SMTP_PORT) === 465,
    auth: SMTP_USER ? { user: SMTP_USER, pass: SMTP_PASS } : undefined,
  });
  await transport.sendMail({
    from: process.env['DEVIS_EXPEDITEUR'] || SMTP_USER,
    to: a.to,
    subject: a.sujet,
    text: a.texte,
    html: a.html,
  });
}
