import type { Metadata } from 'next';
import Link from 'next/link';
import { getEntries, getStats } from '@/lib/data';
import { plural } from '@/lib/contest';
import PrizeTable from '@/components/PrizeTable';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Žebříček' };

export default async function LeaderboardPage() {
  const [entries, stats] = await Promise.all([getEntries({ sort: 'top', limit: 30 }), getStats()]);

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">Žebříček</p>
        <h1 className="section-title">Kdo zrovna vede</h1>
        <p className="section-lead">
          {stats.photos} {plural(stats.photos, 'fotka', 'fotky', 'fotek')} od {stats.entrants}{' '}
          {plural(stats.entrants, 'soutěžícího', 'soutěžících', 'soutěžících')}, celkem {stats.votes}{' '}
          {plural(stats.votes, 'hlas', 'hlasy', 'hlasů')}.
        </p>
        <PrizeTable entrants={stats.entrants} />
        {entries.length === 0 ? (
          <p className="muted" style={{ marginTop: 24 }}>Zatím tu nic není.</p>
        ) : (
          <ol className="ranking">
            {entries.map((e, i) => (
              <li key={e.id}>
                <Link href={`/foto/${e.id}`} className="rank">
                  <span className="rank-pos">{i + 1}.</span>
                  <span>
                    @{e.author_handle}
                    {e.shot_on_oppo && <span className="badge">#ShotOnOPPO</span>}
                  </span>
                  <span className="rank-votes">
                    {e.votes} {plural(e.votes, 'hlas', 'hlasy', 'hlasů')}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
