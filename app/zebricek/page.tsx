import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { getEntries, getStats } from '@/lib/data';
import { plural } from '@/lib/contest';
import PrizeTable from '@/components/PrizeTable';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = pageMeta({
  title: 'Žebříček',
  description: 'Aktuální pořadí fotek podle hlasů komunity v soutěži OPPO Lovci světla. Hraje se o OPPO Find X10, OPPO Watch S a OPPO Enco Air5 Pro.',
  path: '/zebricek',
});

export default async function LeaderboardPage() {
  const [entries, stats] = await Promise.all([getEntries({ sort: 'top', limit: 30 }), getStats()]);

  return (
    <section className="section-tight">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="label">Žebříček</span>
            <h1 className="h2" style={{ marginTop: 12 }}>Kdo zrovna vede</h1>
          </div>
          <p className="lead">
            {stats.photos} {plural(stats.photos, 'fotka', 'fotky', 'fotek')}, {stats.entrants}{' '}
            {plural(stats.entrants, 'soutěžící', 'soutěžící', 'soutěžících')}, {stats.votes} {plural(stats.votes, 'hlas', 'hlasy', 'hlasů')}.
            Pořadí se mění každou minutu.
          </p>
        </div>
        <PrizeTable entrants={stats.entrants} />
        {entries.length === 0 ? (
          <p className="empty" style={{ marginTop: 40 }}>Zatím tu nic není.</p>
        ) : (
          <ol className="ranking" style={{ marginTop: 48 }}>
            {entries.map((e, i) => (
              <li key={e.id}>
                <Link href={`/foto/${e.id}`} className="rank">
                  <span className="rank-pos">{String(i + 1).padStart(2, '0')}</span>
                  <span>
                    @{e.author_handle}
                    {e.shot_on_oppo && <span className="badge">Shot on OPPO</span>}
                  </span>
                  <span className="rank-votes">{e.votes} {plural(e.votes, 'hlas', 'hlasy', 'hlasů')}</span>
                </Link>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
