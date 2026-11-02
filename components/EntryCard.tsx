import Link from 'next/link';
import type { Entry } from '@/lib/data';
import type { Phase } from '@/lib/contest';
import InstagramEmbed from './InstagramEmbed';
import VoteButton from './VoteButton';

export default function EntryCard({
  entry,
  voted,
  loggedIn,
  phase,
  returnTo,
}: {
  entry: Entry;
  voted: boolean;
  loggedIn: boolean;
  phase: Phase;
  returnTo?: string;
}) {
  return (
    <article className="entry">
      <InstagramEmbed shortcode={entry.shortcode} author={entry.author_handle} />
      <div className="entry-foot">
        <div style={{ minWidth: 0 }}>
          <Link href={`/foto/${entry.id}`} className="entry-author">@{entry.author_handle}</Link>
          {entry.shot_on_oppo && <span className="badge">#ShotOnOPPO</span>}
          <div className="entry-meta">
            <Link href={`/foto/${entry.id}`}>Sdílet fotku</Link>
          </div>
        </div>
        <VoteButton entryId={entry.id} initialVotes={entry.votes} initialVoted={voted} loggedIn={loggedIn} phase={phase} returnTo={returnTo} />
      </div>
    </article>
  );
}
