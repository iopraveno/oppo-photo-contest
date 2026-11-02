'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { CONTEST } from '@/lib/config';
import { shortDate, type Phase } from '@/lib/contest';

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
  phase,
  returnTo,
  size = 'small',
}: {
  entryId: string;
  initialVotes: number;
  initialVoted: boolean;
  loggedIn: boolean;
  phase: Phase;
  /** Where to come back after signing in; defaults to the current page. */
  returnTo?: string;
  size?: 'small' | 'large';
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(initialVoted);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();
  const open = phase === 'entries' || phase === 'voting';

  function signIn() {
    router.push(`/prihlaseni?next=${encodeURIComponent(returnTo || pathname)}`);
  }

  function vote() {
    setError(null);
    startTransition(async () => {
      const res = await fetch('/api/vote', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entryId }),
      });
      const data = (await res.json().catch(() => ({}))) as { votes?: number; error?: string };
      if (res.status === 401) return signIn();
      if (res.ok || res.status === 409) {
        setVoted(true);
        if (typeof data.votes === 'number') setVotes(data.votes);
        return;
      }
      setError(data.error || 'Hlas se nepodařilo uložit. Zkus to prosím znovu.');
    });
  }

  // One clear state per situation: ended, signed out, already voted, not started yet, ready to vote.
  let label: string;
  let onClick: (() => void) | undefined;
  let variant = 'btn-black';
  if (phase === 'ended') {
    label = 'Hlasování skončilo';
  } else if (!loggedIn) {
    label = 'Přihlásit se a hlasovat';
    onClick = signIn;
  } else if (voted) {
    label = 'Už jsi hlasoval(a) ✓';
    variant = 'btn-black voted';
  } else if (!open) {
    label = `Hlasování od ${shortDate(CONTEST.start)}`;
  } else {
    label = pending ? 'Ukládám…' : 'Hlasovat';
    onClick = vote;
  }

  return (
    <div>
      <div className="vote">
        <span className="vote-count" aria-live="polite">
          {votes} <span>{votesLabel(votes)}</span>
        </span>
        <button
          type="button"
          className={`btn ${variant} vote-btn${size === 'small' ? ' btn-small' : ''}`}
          onClick={onClick}
          disabled={!onClick || pending}
        >
          {label}
        </button>
      </div>
      {error && <p className="small" style={{ color: '#8a1c1c', marginTop: 6 }}>{error}</p>}
    </div>
  );
}
