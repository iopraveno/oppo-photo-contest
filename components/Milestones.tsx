import { CONTEST } from '@/lib/config';
import { nextMilestone, plural } from '@/lib/contest';

export default function Milestones({ entrants }: { entrants: number }) {
  const top = CONTEST.milestones[CONTEST.milestones.length - 1].at;
  const pct = Math.min(100, Math.round((entrants / top) * 100));
  const next = nextMilestone(entrants);
  const missing = next ? next.at - entrants : 0;

  return (
    <div>
      <div className="counter">
        <span className="counter-num">{entrants}</span>
        <span style={{ fontSize: 20 }}>
          {plural(entrants, 'lovec světla už se zapojil', 'lovci světla už se zapojili', 'lovců světla už se zapojilo')}
        </span>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={top}
        aria-valuenow={entrants}
        aria-label="Postup k hlavní výhře"
      >
        <div className="progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <p style={{ color: 'var(--mist)' }}>
        {next
          ? `Do odemčení ${next.prize} chybí ${missing} ${plural(missing, 'soutěžící', 'soutěžící', 'soutěžících')}.`
          : 'Všechny výhry jsou odemčené, včetně OPPO Find X10!'}
      </p>
      <div className="milestones">
        {CONTEST.milestones.map((m) => {
          const unlocked = entrants >= m.at;
          return (
            <div key={m.at} className={`milestone${unlocked ? ' unlocked' : ''}`}>
              <div className="milestone-at">{m.at === 0 ? 'Od startu' : `Od ${m.at} soutěžících`}</div>
              <div className="milestone-prize">{m.prize}</div>
              <div className="milestone-state">{unlocked ? 'Odemčeno ✓' : 'Zatím zamčeno'}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
