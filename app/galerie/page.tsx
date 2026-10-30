import type { Metadata } from 'next';
import Link from 'next/link';
import { getEntries, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { isVotingOpen } from '@/lib/contest';
import { CONTEST } from '@/lib/config';
import EntryCard from '@/components/EntryCard';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Galerie' };

type Search = Promise<{ filtr?: string; razeni?: string }>;

export default async function GalleryPage({ searchParams }: { searchParams: Search }) {
  const params = await searchParams;
  const filter = params.filtr === 'oppo' ? 'oppo' : 'all';
  const sort = params.razeni === 'hlasy' ? 'top' : 'new';
  const [entries, user] = await Promise.all([getEntries({ filter, sort }), getUser()]);
  const voted = await getVotedEntryIds(user?.id);
  const votingOpen = isVotingOpen();

  const href = (f: string, s: string) => {
    const q = new URLSearchParams();
    if (f === 'oppo') q.set('filtr', 'oppo');
    if (s === 'top') q.set('razeni', 'hlasy');
    const str = q.toString();
    return str ? `/galerie?${str}` : '/galerie';
  };

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">Galerie</p>
        <h1 className="section-title">Fotky lovců světla</h1>
        <p className="section-lead">
          Hlasovat může každý s ověřeným e-mailem. Každé fotce můžeš dát jeden hlas, fotek ale můžeš podpořit kolik chceš.
        </p>
        {!user && votingOpen && (
          <p className="alert alert-info" style={{ marginTop: 16, maxWidth: 720 }}>
            Pro hlasování se nejdřív <Link href="/prihlaseni?next=/galerie">přihlas e-mailem</Link>. Zabere to minutu.
          </p>
        )}
        <div className="toolbar">
          <div className="chips">
            <Link href={href('all', sort)} className={`chip${filter === 'all' ? ' active' : ''}`}>Všechny</Link>
            <Link href={href('oppo', sort)} className={`chip${filter === 'oppo' ? ' active' : ''}`}>{CONTEST.oppoHashtag}</Link>
          </div>
          <div className="chips">
            <Link href={href(filter, 'new')} className={`chip${sort === 'new' ? ' active' : ''}`}>Nejnovější</Link>
            <Link href={href(filter, 'top')} className={`chip${sort === 'top' ? ' active' : ''}`}>Nejvíc hlasů</Link>
          </div>
        </div>
        {entries.length === 0 ? (
          <p className="muted">Zatím tu nic není. První fotky přibudou hned po startu soutěže.</p>
        ) : (
          <div className="gallery">
            {entries.map((e) => (
              <EntryCard key={e.id} entry={e} voted={voted.has(e.id)} loggedIn={Boolean(user)} votingOpen={votingOpen} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
