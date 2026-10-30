import { CONTEST } from '@/lib/config';
import { nextMilestone, plural } from '@/lib/contest';
import { img } from '@/lib/images';

const prizeImages: Record<number, string> = { 0: 'prize-air5pro.png', 50: 'prize-watch-s.png', 150: 'prize-find-x10.png' };

export default function Milestones({ entrants }: { entrants: number }) {
  const top = CONTEST.milestones[CONTEST.milestones.length - 1].at;
  const pct = Math.min(100, Math.round((entrants / top) * 100));
  const next = nextMilestone(entrants);
  const missing = next ? next.at - entrants : 0;

  return (
    <div className="milestone-wrap">
      <div className="counter">
        <span className="label">Zapojilo se</span>
        <span className="counter-num">{entrants}</span>
        <span className="counter-text">
          {plural(entrants, 'lovec světla. Každý další posune celou komunitu blíž k další ceně.', 'lovci světla. Každý další posune celou komunitu blíž k další ceně.', 'lovců světla. Každý další posune celou komunitu blíž k další ceně.')}
        </span>
        <span className="counter-next">
          {next
            ? `Do odemčení ${next.prize.replace('OPPO ', '')} chybí ${missing} ${plural(missing, 'soutěžící', 'soutěžící', 'soutěžících')}.`
            : 'Všechny ceny jsou odemčené, včetně Find X10.'}
        </span>
      </div>
      <div className="track">
        <div className="track-bar" role="progressbar" aria-valuemin={0} aria-valuemax={top} aria-valuenow={entrants} aria-label="Postup k hlavní výhře">
          <div className="track-fill" style={{ width: `${pct}%` }} />
        </div>
        <div className="track-points">
          {CONTEST.milestones.map((m) => {
            const unlocked = entrants >= m.at;
            const src = img(prizeImages[m.at]);
            return (
              <div key={m.at} className={`track-point${unlocked ? ' unlocked' : ''}`}>
                {src && <img className="track-img" src={src} alt={m.prize} loading="lazy" />}
                <div className="track-at">{m.at === 0 ? 'Od startu' : `${m.at} soutěžících`}</div>
                <div className="track-prize">{m.prize.replace('OPPO ', '')}</div>
                <div className="track-state">{unlocked ? 'Odemčeno' : 'Zatím zamčeno'}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
