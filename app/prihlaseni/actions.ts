'use server';

import { redirect } from 'next/navigation';
import { createSessionClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/env';
import { isDisposableEmail, isValidEmail } from '@/lib/disposable';
import { clientIp, verifyTurnstile } from '@/lib/security';

export type LoginState = { step: 'email' | 'code'; email?: string; error?: string; info?: string };

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === 'string' ? value : '/galerie';
  return next.startsWith('/') && !next.startsWith('//') ? next : '/galerie';
}

export async function sendCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  if (!isValidEmail(email)) return { step: 'email', email, error: 'Zadej prosím platný e-mail.' };
  if (isDisposableEmail(email)) {
    return { step: 'email', email, error: 'Jednorázové e-maily nepodporujeme. Použij prosím svůj běžný e-mail.' };
  }
  if (!isSupabaseConfigured()) return { step: 'email', email, error: 'Web ještě není napojený na databázi.' };

  const ip = await clientIp();
  const captcha = formData.get('cf-turnstile-response');
  if (!(await verifyTurnstile(typeof captcha === 'string' ? captcha : null, ip))) {
    return { step: 'email', email, error: 'Ověření, že nejsi robot, se nepovedlo. Zkus to prosím znovu.' };
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true } });
  if (error) {
    const tooMany = error.status === 429;
    return {
      step: 'email',
      email,
      error: tooMany ? 'Moc pokusů za sebou. Zkus to prosím za pár minut.' : 'E-mail se nepodařilo odeslat. Zkus to prosím znovu.',
    };
  }
  return { step: 'code', email, info: `Poslali jsme kód na ${email}. Mrkni i do spamu.` };
}

export async function verifyCode(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const token = String(formData.get('code') || '').replace(/\s/g, '');
  if (!/^\d{6,10}$/.test(token)) return { step: 'code', email, error: 'Opiš prosím číselný kód z e-mailu.' };

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.verifyOtp({ email, token, type: 'email' });
  if (error) {
    return { step: 'code', email, error: 'Kód nesedí nebo už vypršel. Zkus ho opsat znovu, nebo si nech poslat nový.' };
  }
  redirect(safeNext(formData.get('next')));
}
