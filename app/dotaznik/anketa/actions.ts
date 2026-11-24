'use server';

import { headers } from 'next/headers';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/env';
import { isDisposableEmail } from '@/lib/disposable';
import { clientIp, hashIp } from '@/lib/security';
import { cleanAnswers, cleanOpen, cleanSource } from '@/lib/survey';
import { ANKETA, isMeetEmail, otherKey } from '@/lib/survey-anketa';
import { ANKETA_CONSENT_TEXT, ANKETA_CONSENT_VERSION, cleanAnketaContact } from '@/lib/anketa-contact';

export type AnketaInput = {
  answers: unknown;
  open?: unknown;
  /** Meeting question: e-mail, optional name, consent to be contacted about the meeting. */
  meetContact?: string;
  meetName?: string;
  meetConsent?: boolean;
  /** Optional OPPO newsletter at the end, with its own consent. */
  newsletter?: boolean;
  email?: string;
  consent?: boolean;
  src?: string;
  startedAt?: number;
  website?: string;
};
export type AnketaResult = { ok: true } | { ok: false; error: string };

// Shared with the main survey's table; events and offices share one IP, so the limit is generous.
const MAX_PER_IP_PER_HOUR = 30;

export async function submitAnketa(input: AnketaInput): Promise<AnketaResult> {
  if (input.website) return { ok: true }; // honeypot

  // Only the questions on this person's path are checked and kept.
  const { answers, error } = cleanAnswers(input.answers, ANKETA.questions, ANKETA.flow);
  if (error) return { ok: false, error: `${error} Doplňte ji prosím a odešlete znovu.` };

  // Text of a "something else" option counts only if that option is still picked.
  const open: Record<string, string> = {};
  const cleanedOpen = cleanOpen(input.open, ANKETA.open);
  for (const [k, v] of Object.entries(cleanedOpen)) if (v) open[k] = v.slice(0, k === 'message' ? 1000 : 200);
  for (const q of ANKETA.questions) {
    if (q.kind === 'matrix') continue;
    const other = q.options.find((o) => o.other)?.value;
    const v = answers[q.id];
    const picked = other !== undefined && (v === other || (Array.isArray(v) && v.includes(other)));
    if (!picked) delete open[otherKey(q.id)];
  }

  // Meeting e-mail: required for "yes", optional for "maybe", ignored otherwise.
  const meet = typeof answers.meet === 'string' ? answers.meet : null;
  const meetEmail = meet === 'ano' || meet === 'mozna' ? String(input.meetContact || '').trim().toLowerCase().slice(0, 120) : '';
  if (meet === 'ano' && !meetEmail) return { ok: false, error: 'Abychom vás mohli pozvat, nechte nám prosím e-mail.' };
  if (meetEmail) {
    if (!isMeetEmail(meetEmail)) return { ok: false, error: 'Zkontrolujte prosím e-mail, takhle nevypadá platně.' };
    if (isDisposableEmail(meetEmail)) return { ok: false, error: 'Jednorázové e-maily nepodporujeme. Použijte prosím svůj běžný e-mail.' };
    if (input.meetConsent !== true) return { ok: false, error: 'Bez souhlasu vás kvůli setkání nemůžeme kontaktovat. Zaškrtněte ho, nebo e-mail smažte.' };
    open.meet_contact = meetEmail;
    const name = String(input.meetName || '').trim().replace(/\s+/g, ' ').slice(0, 80);
    if (name) open.contact_name = name;
    open.meet_consent_at = new Date().toISOString();
  }

  // Newsletter: skipping never stores an e-mail, even a previously typed one.
  const newsletter = cleanAnketaContact(input);
  if (newsletter.error) return { ok: false, error: newsletter.error };
  if (newsletter.consent) {
    open.newsletter_consent_version = ANKETA_CONSENT_VERSION;
    open.newsletter_consent_text = ANKETA_CONSENT_TEXT;
    open.newsletter_consent_at = new Date().toISOString();
  }

  if (!isSupabaseConfigured()) return { ok: false, error: 'Web ještě není napojený na databázi.' };

  const ipHash = hashIp(await clientIp());
  const supabase = createAdminClient();
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('survey_responses')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo);
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) return { ok: false, error: 'Z tohoto připojení přišlo moc odpovědí. Zkuste to prosím za hodinu.' };

  const started = Number(input.startedAt);
  const seconds = Number.isFinite(started) && started > 0 ? Math.round((Date.now() - started) / 1000) : null;
  const ua = (await headers()).get('user-agent') || '';

  const { error: dbError } = await supabase.from('survey_responses').insert({
    survey: ANKETA.slug,
    answers,
    open_answers: open,
    // email + contact_consent = newsletter opt-in; the meeting contact lives in open_answers.
    email: newsletter.email,
    contact_consent: newsletter.consent,
    // null = not asked (people who are not interested skip the meeting question)
    wants_meeting: meet === null ? null : meet === 'ano',
    src: cleanSource(input.src),
    duration_s: seconds !== null && seconds >= 0 && seconds < 3 * 60 * 60 ? seconds : null,
    device: /Mobi|Android|iPhone/i.test(ua) ? 'mobil' : 'pocitac',
    ip_hash: ipHash,
  });
  if (dbError) {
    console.error('anketa insert failed:', dbError.message);
    return { ok: false, error: 'Odpovědi se nepodařilo uložit. Zkuste to prosím znovu.' };
  }
  return { ok: true };
}
