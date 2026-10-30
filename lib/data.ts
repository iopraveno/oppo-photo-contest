import 'server-only';
import { createAdminClient } from './supabase/admin';
import { isSupabaseConfigured } from './env';

export type Entry = {
  id: string;
  shortcode: string;
  permalink: string;
  author_handle: string;
  shot_on_oppo: boolean;
  hidden: boolean;
  created_at: string;
  votes: number;
};

export type Stats = { entrants: number; photos: number; votes: number };

// Sample data so the site can be previewed locally before Supabase is set up.
const DEMO = process.env.NODE_ENV !== 'production' && !isSupabaseConfigured();
const demoEntries: Entry[] = [
  ['Cz1aaaaaaa', 'jana.foti', true, 42],
  ['Cz2bbbbbbb', 'petr_svetlo', false, 37],
  ['Cz3ccccccc', 'mlhy.beskydy', true, 21],
  ['Cz4ddddddd', 'praha.night', false, 18],
  ['Cz5eeeeeee', 'lucie.k', false, 9],
  ['Cz6fffffff', 'oppo.lover', true, 4],
].map(([shortcode, author, oppo, votes], i) => ({
  id: `00000000-0000-4000-8000-00000000000${i + 1}`,
  shortcode: shortcode as string,
  permalink: `https://www.instagram.com/p/${shortcode}/`,
  author_handle: author as string,
  shot_on_oppo: oppo as boolean,
  hidden: false,
  created_at: new Date(Date.UTC(2026, 10, 4 + i)).toISOString(),
  votes: votes as number,
}));

export async function getEntries(opts: { filter?: 'all' | 'oppo'; sort?: 'new' | 'top'; limit?: number } = {}) {
  const { filter = 'all', sort = 'new', limit } = opts;
  if (!isSupabaseConfigured()) {
    if (!DEMO) return [];
    let list = demoEntries.filter((e) => filter === 'all' || e.shot_on_oppo);
    list = [...list].sort((a, b) => (sort === 'top' ? b.votes - a.votes : b.created_at.localeCompare(a.created_at)));
    return limit ? list.slice(0, limit) : list;
  }
  const supabase = createAdminClient();
  let query = supabase.from('entry_scores').select('*').eq('hidden', false);
  if (filter === 'oppo') query = query.eq('shot_on_oppo', true);
  query =
    sort === 'top'
      ? query.order('votes', { ascending: false }).order('created_at', { ascending: true })
      : query.order('created_at', { ascending: false });
  if (limit) query = query.limit(limit);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Entry[];
}

export async function getEntry(id: string): Promise<Entry | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  if (!isSupabaseConfigured()) return DEMO ? demoEntries.find((e) => e.id === id) ?? null : null;
  const supabase = createAdminClient();
  const { data } = await supabase.from('entry_scores').select('*').eq('id', id).eq('hidden', false).maybeSingle();
  return (data as Entry) ?? null;
}

export async function getStats(): Promise<Stats> {
  if (!isSupabaseConfigured()) {
    if (!DEMO) return { entrants: 0, photos: 0, votes: 0 };
    return {
      entrants: 37,
      photos: demoEntries.length,
      votes: demoEntries.reduce((s, e) => s + e.votes, 0),
    };
  }
  const supabase = createAdminClient();
  const [{ data: entries }, { count: votes }] = await Promise.all([
    supabase.from('entries').select('author_handle').eq('hidden', false),
    supabase.from('votes').select('id', { count: 'exact', head: true }),
  ]);
  const handles = new Set((entries ?? []).map((e) => String(e.author_handle).toLowerCase()));
  return { entrants: handles.size, photos: entries?.length ?? 0, votes: votes ?? 0 };
}

export async function getVotedEntryIds(userId: string | undefined): Promise<Set<string>> {
  if (!userId || !isSupabaseConfigured()) return new Set();
  const supabase = createAdminClient();
  const { data } = await supabase.from('votes').select('entry_id').eq('user_id', userId);
  return new Set((data ?? []).map((v) => v.entry_id as string));
}
