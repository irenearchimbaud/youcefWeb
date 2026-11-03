import nodemailer from 'nodemailer';

export interface Courriel {
  to: string;
  replyTo?: string;
  subject: string;
  text: string;
}

const env = process.env;

/**
 * Envoie un mail via SMTP (variables SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, MAIL_FROM).
 * Sans SMTP_HOST (dev local), le mail est simplement affiché dans la console du serveur.
 */
export async function envoyerMail(courriel: Courriel): Promise<void> {
  if (!env['SMTP_HOST']) {
    console.log('[mail non envoyé : SMTP_HOST absent]\n', courriel);
    return;
  }

  const transport = nodemailer.createTransport({
    host: env['SMTP_HOST'],
    port: Number(env['SMTP_PORT'] ?? 587),
    secure: env['SMTP_PORT'] === '465',
    auth: env['SMTP_USER'] ? { user: env['SMTP_USER'], pass: env['SMTP_PASS'] } : undefined,
  });

  await transport.sendMail({ from: env['MAIL_FROM'] ?? env['SMTP_USER'], ...courriel });
}
