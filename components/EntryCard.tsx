import Link from 'next/link';
import type { Entry } from '@/lib/data';
import InstagramEmbed from './InstagramEmbed';
import VoteButton from './VoteButton';

export default function EntryCard({
  entry,
  voted,
  loggedIn,
  votingOpen,
}: {
  entry: Entry;
  voted: boolean;
  loggedIn: boolean;
  votingOpen: boolean;
}) {
  return (
    <article className="entry">
      <InstagramEmbed shortcode={entry.shortcode} author={entry.author_handle} />
      <div className="entry-foot">
        <div style={{ minWidth: 0 }}>
          <Link href={`/foto/${entry.id}`} className="entry-author">@{entry.author_handle}</Link>
          {entry.shot_on_oppo && <span className="badge">Shot on OPPO</span>}
          <div className="entry-meta">
            <Link href={`/foto/${entry.id}`}>Sdílet fotku</Link>
          </div>
        </div>
        <VoteButton entryId={entry.id} initialVotes={entry.votes} initialVoted={voted} loggedIn={loggedIn} votingOpen={votingOpen} />
      </div>
    </article>
  );
}
