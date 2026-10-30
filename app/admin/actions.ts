'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isValidHandle, normalizeHandle, parseInstagramUrl } from '@/lib/instagram';
import { CONTEST } from '@/lib/config';

function back(params: Record<string, string>, path = '/admin'): never {
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

/** Week number of the contest (1, 2, 3…) for a date. */
function contestWeek(date: Date) {
  const start = new Date(CONTEST.start).getTime();
  return Math.floor((date.getTime() - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
}

export async function addEntry(formData: FormData) {
  await requireAdmin();
  const parsed = parseInstagramUrl(String(formData.get('url') || ''));
  const handle = normalizeHandle(String(formData.get('handle') || ''));
  const shotOnOppo = formData.get('oppo') === 'on';
  const force = formData.get('force') === 'on';

  if (!parsed) back({ err: 'Odkaz nevypadá jako příspěvek na Instagramu (instagram.com/p/… nebo /reel/…).' });
  if (!isValidHandle(handle)) back({ err: 'Zadej instagramové jméno autora (bez @).' });

  const supabase = createAdminClient();

  const { data: existing } = await supabase.from('entries').select('id').eq('shortcode', parsed.shortcode).maybeSingle();
  if (existing) back({ err: 'Tenhle příspěvek už v galerii je.' });

  if (!force) {
    const { data: byAuthor } = await supabase.from('entries').select('created_at').eq('author_handle', handle);
    const list = byAuthor ?? [];
    if (list.length >= CONTEST.maxEntriesPerPerson) {
      back({ err: `@${handle} už má ${list.length} fotky, maximum je ${CONTEST.maxEntriesPerPerson}. Pokud chceš přesto přidat, zaškrtni „Přidat i přes limit“.` });
    }
    const thisWeek = contestWeek(new Date());
    if (list.some((e) => contestWeek(new Date(e.created_at as string)) === thisWeek)) {
      back({ err: `@${handle} už má fotku z tohoto týdne. Pokud chceš přesto přidat, zaškrtni „Přidat i přes limit“.` });
    }
  }

  const { error } = await supabase.from('entries').insert({
    shortcode: parsed.shortcode,
    permalink: parsed.permalink,
    author_handle: handle,
    shot_on_oppo: shotOnOppo,
  });
  if (error) back({ err: `Uložení se nepovedlo: ${error.message}` });

  revalidatePath('/', 'layout');
  back({ ok: `Fotka od @${handle} je v galerii.` });
}

export async function setHidden(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  const hidden = formData.get('hidden') === 'true';
  const supabase = createAdminClient();
  await supabase.from('entries').update({ hidden }).eq('id', id);
  revalidatePath('/', 'layout');
  back({ ok: hidden ? 'Fotka je skrytá.' : 'Fotka je znovu vidět.' });
}

export async function deleteEntry(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get('id') || '');
  if (formData.get('confirm') !== 'ano') back({ err: 'Pro smazání napiš do políčka „ano“.' });
  const supabase = createAdminClient();
  await supabase.from('entries').delete().eq('id', id);
  revalidatePath('/', 'layout');
  back({ ok: 'Fotka i její hlasy jsou smazané.' });
}

export async function deleteVote(formData: FormData) {
  await requireAdmin();
  const id = Number(formData.get('id'));
  const supabase = createAdminClient();
  await supabase.from('votes').delete().eq('id', id);
  revalidatePath('/', 'layout');
  back({ ok: 'Hlas je zrušený.' }, '/admin/hlasy');
}

export async function deleteVotesByIp(formData: FormData) {
  await requireAdmin();
  const ipHash = String(formData.get('ip') || '');
  if (!ipHash) back({ err: 'Chybí IP.' }, '/admin/hlasy');
  const supabase = createAdminClient();
  const { count } = await supabase.from('votes').delete({ count: 'exact' }).eq('ip_hash', ipHash);
  revalidatePath('/', 'layout');
  back({ ok: `Zrušeno ${count ?? 0} hlasů z jedné IP adresy.` }, '/admin/hlasy');
}
