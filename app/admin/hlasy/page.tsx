import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { deleteVote, deleteVotesByIp } from '../actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Kontrola hlasů', robots: { index: false } };

type Search = Promise<{ fotka?: string; ok?: string; err?: string }>;
type Vote = { id: number; entry_id: string; voter_email: string | null; ip_hash: string | null; created_at: string; entries: { author_handle: string } | null };

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Europe/Prague' });

export default async function VotesPage({ searchParams }: { searchParams: Search }) {
  await requireAdmin();
  const { fotka, ok, err } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from('votes')
    .select('id, entry_id, voter_email, ip_hash, created_at, entries(author_handle)')
    .order('created_at', { ascending: false })
    .limit(300);
  if (fotka && /^[0-9a-f-]{36}$/i.test(fotka)) query = query.eq('entry_id', fotka);
  const { data } = await query;
  const votes = (data ?? []) as unknown as Vote[];

  // Suspicious patterns in the last 24 hours: many votes from one IP, many votes per photo per hour.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recent } = await supabase.from('votes').select('entry_id, ip_hash, created_at').gte('created_at', dayAgo).limit(20000);
  const byIp = new Map<string, number>();
  const byEntryHour = new Map<string, number>();
  (recent ?? []).forEach((v) => {
    if (v.ip_hash) byIp.set(v.ip_hash, (byIp.get(v.ip_hash) ?? 0) + 1);
    const key = `${v.entry_id}|${String(v.created_at).slice(0, 13)}`;
    byEntryHour.set(key, (byEntryHour.get(key) ?? 0) + 1);
  });
  const topIps = [...byIp.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
  const spikes = [...byEntryHour.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);

  return (
    <section className="section">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <p className="eyebrow"><Link href="/admin">← Administrace</Link></p>
          <h1 className="section-title">Kontrola hlasů</h1>
          <p className="muted">
            Hledej skoky: hodně hlasů z jedné IP adresy nebo desítky hlasů pro jednu fotku během jedné hodiny. Podezřelé hlasy zruš.
          </p>
        </div>
        {ok && <p className="alert alert-ok">{ok}</p>}
        {err && <p className="alert alert-err">{err}</p>}

        <div className="grid-3" style={{ marginTop: 0 }}>
          <div className="card" style={{ overflowX: 'auto' }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Nejvíc hlasů z jedné IP (24 h)</h2>
            <table className="admin-table">
              <tbody>
                {topIps.map(([ip, n]) => (
                  <tr key={ip}>
                    <td><code>{ip.slice(0, 10)}</code></td>
                    <td>{n}</td>
                    <td>
                      <form action={deleteVotesByIp}>
                        <input type="hidden" name="ip" value={ip} />
                        <button className="btn btn-ghost btn-small" type="submit">Zrušit vše</button>
                      </form>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card" style={{ overflowX: 'auto' }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Nejvíc hlasů za hodinu (24 h)</h2>
            <table className="admin-table">
              <tbody>
                {spikes.map(([key, n]) => {
                  const [entryId, hour] = key.split('|');
                  return (
                    <tr key={key}>
                      <td><Link href={`/admin/hlasy?fotka=${entryId}`}>{entryId.slice(0, 8)}</Link></td>
                      <td>{hour.replace('T', ' ')}:00 UTC</td>
                      <td>{n}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <h2 style={{ fontSize: 20, marginBottom: 12 }}>
            {fotka ? 'Hlasy pro vybranou fotku' : 'Posledních 300 hlasů'} {fotka && <Link href="/admin/hlasy" className="small">(zobrazit vše)</Link>}
          </h2>
          <table className="admin-table">
            <thead>
              <tr><th>Čas</th><th>Fotka</th><th>E-mail</th><th>IP</th><th></th></tr>
            </thead>
            <tbody>
              {votes.map((v) => (
                <tr key={v.id}>
                  <td>{timeFmt.format(new Date(v.created_at))}</td>
                  <td><Link href={`/admin/hlasy?fotka=${v.entry_id}`}>@{v.entries?.author_handle ?? '?'}</Link></td>
                  <td>{v.voter_email}</td>
                  <td><code>{v.ip_hash?.slice(0, 10)}</code></td>
                  <td>
                    <form action={deleteVote}>
                      <input type="hidden" name="id" value={v.id} />
                      <button className="btn btn-ghost btn-small" type="submit">Zrušit</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
