import type { Metadata } from 'next';
import Link from 'next/link';
import { getEntries, getStats, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { clockTime, getPhase, plural, shortDate } from '@/lib/contest';
import { CONTEST } from '@/lib/config';
import EntryCard from '@/components/EntryCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Galerie' };

type Search = Promise<{ filtr?: string; razeni?: string }>;

export default async function GalleryPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const filter = params.filtr === 'oppo' ? 'oppo' : 'all';
  const sort = params.razeni === 'hlasy' ? 'top' : 'new';
  const [entries, user, stats] = await Promise.all([getEntries({ filter, sort }), getUser(), getStats()]);
  const voted = await getVotedEntryIds(user?.id);
  const phase = getPhase();

  const href = (f: string, s: string) => {
    const q = new URLSearchParams();
    if (f === 'oppo') q.set('filtr', 'oppo');
    if (s === 'top') q.set('razeni', 'hlasy');
    const str = q.toString();
    return str ? `/galerie?${str}` : '/galerie';
  };

  return (
    <section className="section-tight">
      <div className="container">
        <div className="section-head">
          <div>
            <span className="label">Galerie</span>
            <h1 className="h2" style={{ marginTop: 12 }}>Fotky lovců světla</h1>
          </div>
          <p className="lead">
            {stats.photos} {plural(stats.photos, 'fotka', 'fotky', 'fotek')} od {stats.entrants}{' '}
            {plural(stats.entrants, 'autora', 'autorů', 'autorů')}. Každé fotce můžeš dát jeden hlas, fotek ale můžeš podpořit kolik chceš.
          </p>
        </div>
        {phase !== 'ended' && (
          <div className="alert alert-info login-bar">
            {user ? (
              <p>
                Hlasuješ jako <strong>{user.email}</strong>.
                {phase === 'before' ? ` Hlasování startuje ${shortDate(CONTEST.start)} v ${clockTime(CONTEST.start)}.` : ' Každé fotce můžeš dát jeden hlas.'}
              </p>
            ) : (
              <>
                <p>Hlasovat můžeš po přihlášení e-mailem. Žádné heslo, pošleme ti jednorázový kód.</p>
                <Link href="/prihlaseni?next=/galerie" className="btn btn-black btn-small">Přihlásit se</Link>
              </>
            )}
          </div>
        )}
        <div className="toolbar">
          <div className="filters">
            <Link href={href('all', sort)} className={`filter${filter === 'all' ? ' active' : ''}`}>Všechny</Link>
            <Link href={href('oppo', sort)} className={`filter${filter === 'oppo' ? ' active' : ''}`}>{CONTEST.oppoHashtag}</Link>
          </div>
          <div className="filters">
            <Link href={href(filter, 'new')} className={`filter${sort === 'new' ? ' active' : ''}`}>Nejnovější</Link>
            <Link href={href(filter, 'top')} className={`filter${sort === 'top' ? ' active' : ''}`}>Nejvíc hlasů</Link>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="empty">Zatím tu nic není. První fotky přibudou hned po startu soutěže.</p>
        ) : (
          <div className="gallery">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} voted={voted.has(e.id)} loggedIn={Boolean(user)} phase={phase} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
