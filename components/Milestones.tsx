import { CONTEST } from '@/lib/config';
import { nextMilestone, plural } from '@/lib/contest';
import type { Stats } from '@/lib/data';

const blurbs: Record<number, string> = {
  0: 'Sluchátka s aktivním potlačením hluku. V hře od prvního dne.',
  50: 'Chytré hodinky s AMOLED displejem. Odemkne je padesátý soutěžící.',
  150: 'Vlajková loď s fotoaparátem Hasselblad. Hlavní cena pro vítěze.',
};

export default function Milestones({ stats }: { stats: Stats }) {
  const { entrants } = stats;
  const top = CONTEST.milestones[CONTEST.milestones.length - 1].at;
  const pct = Math.min(100, (entrants / top) * 100);
  const next = nextMilestone(entrants);
  const missing = next ? next.at - entrants : 0;

  return (
    <div className="ms">
      <div className="ms-head">
        <div className="ms-count">
          <span className="ms-num">{entrants}</span>
          <span className="ms-count-label">
            {plural(entrants, 'soutěžící', 'soutěžící', 'soutěžících')}
            <br />
            {stats.votes} {plural(stats.votes, 'hlas', 'hlasy', 'hlasů')}
          </span>
        </div>
        <p className="ms-next">
          {next
            ? <>Do odemčení <strong>{next.prize.replace('OPPO ', '')}</strong> chybí {missing} {plural(missing, 'soutěžící', 'soutěžící', 'soutěžících')}.</>
            : <>Všechny ceny jsou odemčené, včetně <strong>Find X10</strong>.</>}
        </p>
      </div>

      <div className="ms-bar" role="progressbar" aria-valuemin={0} aria-valuemax={top} aria-valuenow={entrants} aria-label="Postup k hlavní výhře">
        <div className="ms-fill" style={{ width: `${pct}%` }} />
        {CONTEST.milestones.map((m) => (
          <span key={m.at} className={`ms-tick${entrants >= m.at ? ' on' : ''}`} style={{ left: `${(m.at / top) * 100}%` }} />
        ))}
      </div>

      <div className="ms-cards">
        {CONTEST.milestones.map((m, i) => {
          const unlocked = entrants >= m.at;
          return (
            <div key={m.at} className={`ms-card${unlocked ? ' on' : ''}`}>
              <div className="ms-card-top">
                <span className="ms-card-at">{m.at === 0 ? 'Od startu' : `${m.at} soutěžících`}</span>
                <span className={`ms-pill${unlocked ? ' on' : ''}`}>{unlocked ? 'Odemčeno' : 'Zamčeno'}</span>
              </div>
              <div className="ms-card-prize">{m.prize.replace('OPPO ', '')}</div>
              <p className="ms-card-text">{blurbs[m.at]}</p>
              <span className="ms-card-place">{i === 0 ? '1. místo' : i === 1 ? 'nové 1. místo, předchozí cena jde na 2.' : 'nové 1. místo, ostatní se posunou'}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
