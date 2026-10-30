import { NextResponse } from 'next/server';
import { getUser } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/env';
import { isVotingOpen } from '@/lib/contest';
import { isDisposableEmail } from '@/lib/disposable';
import { clientIp, hashIp } from '@/lib/security';

const PER_IP_PER_HOUR = Number(process.env.VOTES_PER_IP_PER_HOUR || 40);

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, { status });
}

async function countVotes(entryId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase.from('votes').select('id', { count: 'exact', head: true }).eq('entry_id', entryId);
  return count ?? 0;
}

export async function POST(request: Request) {
  if (!isSupabaseConfigured()) return json(503, { error: 'Hlasování ještě není spuštěné.' });

  const user = await getUser();
  if (!user) return json(401, { error: 'Pro hlasování se přihlas.' });
  if (!isVotingOpen()) return json(403, { error: 'Hlasování je teď zavřené.' });
  if (isDisposableEmail(user.email)) return json(403, { error: 'S jednorázovým e-mailem hlasovat nelze.' });

  const body = (await request.json().catch(() => ({}))) as { entryId?: string };
  const entryId = String(body.entryId || '');
  if (!/^[0-9a-f-]{36}$/i.test(entryId)) return json(400, { error: 'Neplatná fotka.' });

  const supabase = createAdminClient();
  const { data: entry } = await supabase.from('entries').select('id, hidden').eq('id', entryId).maybeSingle();
  if (!entry || entry.hidden) return json(404, { error: 'Fotka nenalezena.' });

  const ipHash = hashIp(await clientIp());
  const hourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count: recent } = await supabase
    .from('votes')
    .select('id', { count: 'exact', head: true })
    .eq('ip_hash', ipHash)
    .gte('created_at', hourAgo);
  if ((recent ?? 0) >= PER_IP_PER_HOUR) {
    return json(429, { error: 'Z tohohle připojení přišlo moc hlasů. Zkus to prosím později.' });
  }

  const { error } = await supabase
    .from('votes')
    .insert({ entry_id: entryId, user_id: user.id, voter_email: user.email, ip_hash: ipHash });

  if (error) {
    if (error.code === '23505') return json(409, { error: 'Tuhle fotku už máš podpořenou.', votes: await countVotes(entryId) });
    return json(500, { error: 'Hlas se nepodařilo uložit.' });
  }
  return json(200, { ok: true, votes: await countVotes(entryId) });
}
