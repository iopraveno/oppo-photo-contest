import 'server-only';
import nodemailer, { type Transporter } from 'nodemailer';
import { ORGANIZER } from './config';

// Transactional e-mail over SMTP. Use the same mailbox that Supabase sends the sign-in codes from
// (Supabase → Authentication → Emails → SMTP Settings), e.g. FORPSI: smtp.forpsi.com, port 465.

/** Env value without stray spaces, new lines or wrapping quotes that sneak in when pasting into Vercel. */
function clean(value: string | undefined) {
  const v = (value || '').trim();
  const quoted = v.length >= 2 && ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'")));
  return quoted ? v.slice(1, -1).trim() : v;
}

function smtp() {
  const port = Number(clean(process.env.SMTP_PORT) || 465);
  return {
    host: clean(process.env.SMTP_HOST),
    port,
    user: clean(process.env.SMTP_USER),
    pass: clean(process.env.SMTP_PASS),
    from: clean(process.env.MAIL_FROM),
    replyTo: clean(process.env.MAIL_REPLY_TO) || ORGANIZER.email,
  };
}

export function isMailConfigured() {
  const c = smtp();
  return Boolean(c.host && c.user && c.pass);
}

/** What the admin may see about the setup (never the password). */
export function mailSetupSummary() {
  const c = smtp();
  return {
    host: c.host || '(chybí SMTP_HOST)',
    port: c.port,
    user: c.user || '(chybí SMTP_USER)',
    from: c.from || (c.user ? `OPPO Česko <${c.user}>` : '(chybí MAIL_FROM)'),
    passLength: c.pass.length,
  };
}

let transporter: Transporter | null = null;

function getTransporter() {
  if (!transporter) {
    const c = smtp();
    transporter = nodemailer.createTransport({
      host: c.host,
      port: c.port,
      secure: c.port === 465,
      auth: { user: c.user, pass: c.pass },
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

/** Plain-language hint for the most common SMTP errors. */
export function explainMailError(error: string) {
  if (/535|Invalid login|authentication (failed|rejected)/i.test(error)) {
    return 'Server odmítl přihlášení: zkontroluj ve Vercelu SMTP_USER (celá e-mailová adresa schránky) a SMTP_PASS (heslo ke schránce, ne do zákaznické administrace FORPSI).';
  }
  if (/GeoIP/i.test(error)) return 'FORPSI blokuje odesílání ze země, kde běží Vercel. Přepni region funkcí na Frankfurt (fra1), nebo požádej FORPSI o povolení země.';
  if (/sender rejected/i.test(error)) return 'MAIL_FROM musí být na stejné doméně jako schránka v SMTP_USER.';
  if (/Too many authorization failures/i.test(error)) return 'Po víc než 10 chybných přihlášeních FORPSI na hodinu zablokoval IP adresu. Oprav údaje a zkus to za hodinu.';
  if (/ENOTFOUND|ECONNREFUSED|ETIMEDOUT|ESOCKET/i.test(error)) return 'Nepodařilo se spojit se serverem: zkontroluj SMTP_HOST a SMTP_PORT (FORPSI: smtp.forpsi.com, 465).';
  return '';
}

/** Sends one e-mail. Returns an error message instead of throwing, so a failed e-mail never breaks a sign-up. */
export async function sendMail(mail: Mail): Promise<{ ok: true; response: string } | { ok: false; error: string }> {
  if (!isMailConfigured()) return { ok: false, error: 'SMTP není nastavené (SMTP_HOST, SMTP_USER, SMTP_PASS).' };
  const c = smtp();
  try {
    const info = await getTransporter().sendMail({
      from: c.from || `OPPO Česko <${c.user}>`,
      replyTo: c.replyTo,
      to: mail.to,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      attachments: mail.attachments,
    });
    // e.g. "250 2.0.0 Ok: queued as 4Xyz": the SMTP server accepted the message for delivery.
    return { ok: true, response: String(info.response || '').slice(0, 160) };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    console.error('sendMail failed:', error);
    const hint = explainMailError(error);
    return { ok: false, error: hint ? `${error}. ${hint}` : error };
  }
}
