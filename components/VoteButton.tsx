'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';

function votesLabel(n: number) {
  if (n === 1) return 'hlas';
  if (n >= 2 && n <= 4) return 'hlasy';
  return 'hlasů';
}

export default function VoteButton({
  entryId,
  initialVotes,
  initialVoted,
  loggedIn,
  votingOpen,
  size = 'small',
}: {
  entryId: string;
  initialVotes: number;
  initialVoted: boolean;
  loggedIn: boolean;
  votingOpen: boolean;
  size?: 'small' | 'large';
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(initialVoted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  function vote() {
    setError(null);
    if (!loggedIn) {
      router.push(`/prihlaseni?next=${encodeURIComponent(pathname)}`);
      return;
    }
    startTransition(async () => {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const data = (await res.json().catch(() => ({}))) as { votes?: number; error?: string };
      if (res.status === 401) {
        router.push(`/prihlaseni?next=${encodeURIComponent(pathname)}`);
        return;
      }
      if (res.ok || res.status === 409) {
        setVoted(true);
        if (typeof data.votes === 'number') setVotes(data.votes);
        return;
      }
      setError(data.error || 'Hlas se nepodařilo uložit. Zkus to prosím znovu.');
    });
  }

  return (
    <div>
      <div className="vote">
        <span className="vote-count" aria-live="polite">
          {votes} <span>{votesLabel(votes)}</span>
        </span>
        <button
          type="button"
          className={`btn btn-black vote-btn${size === 'small' ? ' btn-small' : ''}${voted ? ' voted' : ''}`}
          onClick={vote}
          disabled={voted || pending || !votingOpen}
        >
          {voted ? 'Hlasováno ✓' : pending ? 'Ukládám…' : votingOpen ? 'Dát hlas' : 'Zavřeno'}
        </button>
      </div>
      {error && <p className="small" style={{ color: '#8a1c1c', marginTop: 6 }}>{error}</p>}
    </div>
  );
}
