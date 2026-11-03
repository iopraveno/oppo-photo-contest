'use server';

import { revalidatePath } from 'next/cache';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/env';
import { isDisposableEmail, isValidEmail } from '@/lib/disposable';
import { clientIp, hashIp, verifyTurnstile } from '@/lib/security';
import { PHOTOWALK } from '@/lib/config';
import { getSeatCounts, isSignupOpen } from '@/lib/photowalk';
import { adminNotifyEmail, receivedEmail } from '@/lib/photowalk-email';
import { sendMail } from '@/lib/mail';

export type SignupState = {
  status: 'idle' | 'error' | 'done';
  error?: string;
  waitlist?: boolean;
  email?: string;
  values?: { name: string; email: string; phone: string; brand: string; model: string };
};

const MAX_PER_IP_PER_HOUR = 5;

/** Keeps digits and a leading +, adds +420 to a bare 9-digit Czech number. */
function normalizePhone(raw: string) {
  const trimmed = raw.trim();
  const plus = trimmed.startsWith('+') || trimmed.startsWith('00');
  let digits = trimmed.replace(/\D/g, '');
  if (trimmed.startsWith('00')) digits = digits.slice(2);
  if (!plus && digits.length === 9) return `+420 ${digits.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`;
  if (digits.length < 9 || digits.length > 15) return null;
  if (digits.startsWith('420') && digits.length === 12) return `+420 ${digits.slice(3).replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3')}`;
  return `+${digits}`;
}

export async function signUp(_prev: SignupState, formData: FormData): Promise<SignupState> {
  const values = {
    name: String(formData.get('name') || '').trim().replace(/\s+/g, ' '),
    email: String(formData.get('email') || '').trim().toLowerCase(),
    phone: String(formData.get('phone') || '').trim(),
    brand: String(formData.get('brand') || ''),
    model: String(formData.get('model') || '').trim().replace(/\s+/g, ' '),
  };
  const fail = (error: string): SignupState => ({ status: 'error', error, values });

  // Bots fill every field, people never see this one.
  if (String(formData.get('website') || '')) return { status: 'done', email: values.email };

  if (!isSignupOpen()) return fail('Přihlašování už skončilo. Pokud chcete přijít, napište nám prosím na e-mail níže.');
  if (values.name.length < 3 || values.name.length > 80) return fail('Vyplňte prosím jméno a příjmení.');
  if (!isValidEmail(values.email)) return fail('Zkontrolujte prosím e-mail, takhle nevypadá platně.');
  if (isDisposableEmail(values.email)) return fail('Jednorázové e-maily nepodporujeme. Použijte prosím svůj běžný e-mail.');
  const phone = normalizePhone(values.phone);
  if (!phone) return fail('Zkontrolujte prosím telefonní číslo.');
  if (!(PHOTOWALK.brands as readonly string[]).includes(values.brand)) return fail('Vyberte prosím, jaký máte telefon.');
  if (values.model.length < 2 || values.model.length > 60) return fail('Napište prosím i model telefonu, třeba Find X10 Pro Max.');
  if (formData.get('consent') !== 'on') return fail('Pro přihlášení je potřeba souhlas se zpracováním údajů.');
  if (!isSupabaseConfigured()) return fail('Web ještě není napojený na databázi.');

  const ip = await clientIp();
  const captcha = formData.get('cf-turnstile-response');
  if (!(await verifyTurnstile(typeof captcha === 'string' ? captcha : null, ip))) {
    return fail('Ověření, že nejste robot, se nepovedlo. Zkuste to prosím znovu.');
  }

  const supabase = createAdminClient();
  const ipHash = hashIp(ip);
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count } = await supabase
    .from('photowalk_signups')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo);
  if ((count ?? 0) >= MAX_PER_IP_PER_HOUR) return fail('Z tohoto připojení přišlo moc přihlášek. Zkuste to prosím za hodinu.');

  const before = await getSeatCounts();
  const waitlist = before.confirmed >= PHOTOWALK.capacity;

  const { error } = await supabase.from('photowalk_signups').insert({
    event: PHOTOWALK.slug,
    name: values.name,
    email: values.email,
    phone,
    brand: values.brand,
    model: values.model,
    ip_hash: ipHash,
  });
  if (error) {
    if (error.code === '23505') {
      return fail('S tímhle e-mailem už přihláška je. Pokud potřebujete něco změnit, odpovězte na e-mail, který vám od nás přišel.');
    }
    console.error('photowalk signUp failed:', error.message);
    return fail('Přihlášku se nepodařilo uložit. Zkuste to prosím znovu.');
  }

  const received = receivedEmail({ brand: values.brand, model: values.model }, waitlist);
  await sendMail({ ...received, to: values.email });

  const notify = (process.env.PHOTOWALK_NOTIFY_EMAILS || '').split(',').map((e) => e.trim()).filter(Boolean);
  if (notify.length) {
    const msg = adminNotifyEmail({ ...values, phone }, { ...before, pending: before.pending + 1 });
    await sendMail({ ...msg, to: notify });
  }

  revalidatePath('/photowalk');
  revalidatePath('/admin/photowalk');
  return { status: 'done', waitlist, email: values.email };
}
