import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntry, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { isVotingOpen } from '@/lib/contest';
import { CONTEST, SITE_URL, instagramProfileUrl } from '@/lib/config';
import InstagramEmbed from '@/components/InstagramEmbed';
import VoteButton from '@/components/VoteButton';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) return { title: 'Fotka nenalezena' };
  return {
    title: `Fotka od @${entry.author_handle}`,
    description: `Dej hlas fotce od @${entry.author_handle} v soutěži ${CONTEST.name}.`,
  };
}

export default async function PhotoPage({ params }: { params: Params }) {
  const { id } = await params;
  const [entry, user] = await Promise.all([getEntry(id), getUser()]);
  if (!entry) notFound();
  const voted = await getVotedEntryIds(user?.id);
  const url = `${SITE_URL}/foto/${entry.id}`;

  return (
    <section className="section">
      <div className="wrap detail">
        <InstagramEmbed shortcode={entry.shortcode} author={entry.author_handle} />
        <div className="detail-side">
          <p className="eyebrow">{CONTEST.name}</p>
          <h1>
            Fotka od{' '}
            <a href={instagramProfileUrl(entry.author_handle)} target="_blank" rel="noopener noreferrer">
              @{entry.author_handle}
            </a>
          </h1>
          {entry.shot_on_oppo && <p><span className="badge" style={{ marginLeft: 0 }}>{CONTEST.oppoHashtag}</span></p>}
          <VoteButton
            entryId={entry.id}
            initialVotes={entry.votes}
            initialVoted={voted.has(entry.id)}
            loggedIn={Boolean(user)}
            votingOpen={isVotingOpen()}
          />
          <div>
            <ShareButton url={url} text={`Dej hlas mé fotce v soutěži ${CONTEST.name}!`} />
          </div>
          <p className="muted">
            Tohle je tvoje fotka? Pošli odkaz kamarádům nebo ho dej do stories. Každý s ověřeným e-mailem může dát jeden hlas.
          </p>
          <p>
            <a href={entry.permalink} target="_blank" rel="noopener noreferrer">Otevřít příspěvek na Instagramu</a> ·{' '}
            <Link href="/galerie">Zpět do galerie</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
