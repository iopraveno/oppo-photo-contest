'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requirePhotowalkAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { PHOTOWALK } from '@/lib/config';
import { getSeatCounts } from '@/lib/photowalk';
import { confirmedEmail } from '@/lib/photowalk-email';
import { sendMail } from '@/lib/mail';

const PATH = '/admin/photowalk';

function back(params: Record<string, string>): never {
  redirect(`${PATH}?${new URLSearchParams(params).toString()}`);
}

function refresh() {
  revalidatePath(PATH);
  revalidatePath('/photowalk');
}

async function load(id: string) {
  const supabase = createAdminClient();
  const { data } = await supabase.from('photowalk_signups').select('id, name, email, status').eq('id', id).eq('event', PHOTOWALK.slug).maybeSingle();
  return data as { id: string; name: string; email: string; status: string } | null;
}

async function sendConfirmation(id: string, email: string) {
  const mail = confirmedEmail();
  const res = await sendMail({ ...mail, to: email });
  if (res.ok) {
    await createAdminClient().from('photowalk_signups').update({ confirm_email_sent_at: new Date().toISOString() }).eq('id', id);
  }
  return res;
}

export async function confirmSignup(formData: FormData) {
  await requirePhotowalkAdmin();
  const signup = await load(String(formData.get('id') || ''));
  if (!signup) back({ err: 'Přihláška nenalezena.' });
  if (signup.status === 'confirmed') back({ err: `${signup.name} už potvrzené místo má.` });

  const counts = await getSeatCounts();
  if (counts.confirmed >= PHOTOWALK.capacity) {
    back({ err: `Všech ${PHOTOWALK.capacity} míst je potvrzených. Nejdřív někomu místo uvolni, nebo zvyš kapacitu v lib/config.ts.` });
  }

  const { error } = await createAdminClient()
    .from('photowalk_signups')
    .update({ status: 'confirmed', confirmed_at: new Date().toISOString() })
    .eq('id', signup.id);
  if (error) back({ err: `Uložení se nepovedlo: ${error.message}` });

  const res = await sendConfirmation(signup.id, signup.email);
  refresh();
  if (!res.ok) back({ err: `${signup.name} má potvrzené místo, ale e-mail se nepodařilo odeslat: ${res.error}` });
  back({ ok: `${signup.name} má potvrzené místo, potvrzovací e-mail odešel.` });
}

export async function resendConfirmation(formData: FormData) {
  await requirePhotowalkAdmin();
  const signup = await load(String(formData.get('id') || ''));
  if (!signup || signup.status !== 'confirmed') back({ err: 'E-mail jde poslat znovu jen potvrzeným.' });
  const res = await sendConfirmation(signup.id, signup.email);
  refresh();
  if (!res.ok) back({ err: `E-mail se nepodařilo odeslat: ${res.error}` });
  back({ ok: `Potvrzení odešlo znovu na ${signup.email}.` });
}

export async function setSignupStatus(formData: FormData) {
  await requirePhotowalkAdmin();
  const signup = await load(String(formData.get('id') || ''));
  const status = String(formData.get('status') || '');
  if (!signup) back({ err: 'Přihláška nenalezena.' });
  if (status !== 'pending' && status !== 'declined') back({ err: 'Neznámý stav.' });
  await createAdminClient()
    .from('photowalk_signups')
    .update({ status, confirmed_at: null })
    .eq('id', signup.id);
  refresh();
  back({ ok: status === 'pending' ? `${signup.name} je zpátky mezi čekajícími.` : `${signup.name} je mezi odmítnutými.` });
}

export async function deleteSignup(formData: FormData) {
  await requirePhotowalkAdmin();
  const signup = await load(String(formData.get('id') || ''));
  if (!signup) back({ err: 'Přihláška nenalezena.' });
  if (formData.get('confirm') !== 'ano') back({ err: 'Pro smazání napiš do políčka „ano“.' });
  await createAdminClient().from('photowalk_signups').delete().eq('id', signup.id);
  refresh();
  back({ ok: `Přihláška od ${signup.name} je smazaná.` });
}
