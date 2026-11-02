import { CONTEST } from '@/lib/config';
import { nextMilestone, plural } from '@/lib/contest';
import type { Stats } from '@/lib/data';

const blurbs: Record<number, string> = {
  0: 'Sluchátka s aktivním potlačením hluku. Ve hře od prvního dne.',
  50: 'Chytré hodinky s AMOLED displejem. Odemkne je padesátý soutěžící.',
  150: 'Vlajková loď s fotoaparátem Hasselblad. Hlavní cena pro vítěze.',
};

export default function Milestones({ stats }: { stats: Stats }) {
  const { entrants } = stats;
  const top = CONTEST.milestones[CONTEST.milestones.length - 1].at;
  // The bar has one equal part per milestone so each tick sits right above its column below;
  // the last part fills once the top prize is unlocked.
  const marks = CONTEST.milestones.map((m) => m.at);
  const part = 100 / marks.length;
  const pct = (() => {
    for (let i = 0; i < marks.length - 1; i++) {
      if (entrants < marks[i + 1]) return part * i + (part * (entrants - marks[i])) / (marks[i + 1] - marks[i]);
    }
    return 100;
  })();
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
          <span key={m.at} className={`ms-tick${entrants >= m.at ? ' on' : ''}`} style={{ left: `${part * CONTEST.milestones.indexOf(m)}%` }} />
        ))}
      </div>

      <ol className="ms-steps">
        {CONTEST.milestones.map((m, i) => {
          const unlocked = entrants >= m.at;
          const left = m.at - entrants;
          return (
            <li key={m.at} className={`ms-step${unlocked ? ' on' : ''}`}>
              <span className="ms-step-at">{m.at}</span>
              <span className="ms-step-unit">{m.at === 0 ? 'od startu' : plural(m.at, 'soutěžící', 'soutěžící', 'soutěžících')}</span>
              <h3 className="ms-step-prize">{m.prize.replace('OPPO ', '')}</h3>
              <p className="ms-step-text">{blurbs[m.at]}</p>
              <p className="ms-step-state">
                {unlocked
                  ? i === 0 ? 'Ve hře' : 'Odemčeno'
                  : `Chybí ${left} ${plural(left, 'soutěžící', 'soutěžící', 'soutěžících')}`}
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
