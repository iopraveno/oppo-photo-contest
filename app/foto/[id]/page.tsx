import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getEntry, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { getPhase } from '@/lib/contest';
import { CONTEST, SITE_URL, instagramProfileUrl } from '@/lib/config';
import InstagramEmbed from '@/components/InstagramEmbed';
import VoteButton from '@/components/VoteButton';
import ShareButton from '@/components/ShareButton';

export const dynamic = 'force-dynamic';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { id } = await params;
  const entry = await getEntry(id);
  if (!entry) return { title: 'Fotka nenalezena', robots: { index: false } };
  // The share image comes from opengraph-image.tsx in this folder.
  return pageMeta({
    title: `Fotka od @${entry.author_handle}`,
    description: `Hlasuj pro fotku od @${entry.author_handle} ve fotosoutěži OPPO ${CONTEST.name}. Rozhoduje komunita, hraje se o OPPO Find X10.`,
    path: `/foto/${entry.id}`,
    image: false,
  });
}

export default async function PhotoPage({ params }: { params: Params }) {
  const { id } = await params;
  const [entry, user] = await Promise.all([getEntry(id), getUser()]);
  if (!entry) notFound();
  const voted = await getVotedEntryIds(user?.id);
  const url = `${SITE_URL}/foto/${entry.id}`;

  return (
    <section className="section-tight">
      <div className="container detail">
        <InstagramEmbed shortcode={entry.shortcode} author={entry.author_handle} fallbackHeight={760} />
        <div className="detail-side">
          <div>
            <h1>
              Fotka od{' '}
              <a href={instagramProfileUrl(entry.author_handle)} target="_blank" rel="noopener noreferrer">@{entry.author_handle}</a>
            </h1>
            {entry.shot_on_oppo && <p style={{ marginTop: 12 }}><span className="badge" style={{ marginLeft: 0 }}>#ShotOnOPPO</span></p>}
          </div>
          <div className="detail-actions">
            <VoteButton
              entryId={entry.id}
              initialVotes={entry.votes}
              initialVoted={voted.has(entry.id)}
              loggedIn={Boolean(user)}
              phase={getPhase()}
              size="large"
            />
            <ShareButton url={url} text={`Dej hlas mé fotce v soutěži ${CONTEST.name}!`} />
          </div>
          <p className="share-note">
            Tohle je tvoje fotka? Pošli odkaz kamarádům nebo ho dej do stories. Hlas může dát každý, kdo se přihlásí e-mailem.
          </p>
          <p className="small">
            <a href={entry.permalink} target="_blank" rel="noopener noreferrer">Otevřít příspěvek na Instagramu</a> |{' '}
            <Link href="/galerie">Zpět do galerie</Link>
          </p>
        </div>
      </div>
    </section>
  );
}
