import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { ORGANIZER } from './config';

// Transactional e-mail over SMTP. Use the same mailbox that Supabase sends the sign-in codes from
// (Supabase → Authentication → Emails → SMTP Settings), e.g. FORPSI: smtp.forpsi.com, port 465.

export function isMailConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const port = Number(process.env.SMTP_PORT || 465);
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  }
  return transporter;
}

export type MailAttachment = { filename: string; content: string; contentType: string };

export type Mail = {
  to: string | string[];
  subject: string;
  html: string;
  text: string;
  attachments?: MailAttachment[];
};

/** Sends one e-mail. Returns an error message instead of throwing, so a failed e-mail never breaks a sign-up. */
export async function sendMail(mail: Mail): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isMailConfigured()) return { ok: false, error: 'SMTP není nastavené (SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  try {
    await getTransporter().sendMail({
      from: process.env.MAIL_FROM || `OPPO Česko <${process.env.SMTP_USER}>`,
      replyTo: process.env.MAIL_REPLY_TO || ORGANIZER.email,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments,
    });
    return { ok: true };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('sendMail failed:', error);
    return { ok: false, error };
  }
}
