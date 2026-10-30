import { CONTEST } from '@/lib/config';

const rows = [
  { label: 'Méně než 50', min: 0, max: 49 },
  { label: '50 až 149', min: 50, max: 149 },
  { label: '150 a víc', min: 150, max: Infinity },
];

function prizesForCount(n: number) {
  return CONTEST.milestones.filter((m) => n >= m.at).map((m) => m.prize.replace('OPPO ', '')).reverse();
}

export default function PrizeTable({ entrants }: { entrants: number }) {
  return (
    <div className="table-wrap">
      <table className="prizes">
        <thead>
          <tr>
            <th>Soutěžících</th>
            <th>1. místo</th>
            <th>2. místo</th>
            <th>3. místo</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const prizes = prizesForCount(r.min);
            const current = entrants >= r.min && entrants <= r.max;
            return (
              <tr key={r.label} className={current ? 'current' : undefined}>
                <td>
                  {r.label}
                  {current && <span className="now">teď</span>}
                </td>
                {[0, 1, 2].map((i) =>
                  prizes[i] ? <td key={i}>{prizes[i]}</td> : <td key={i} className="locked">zatím zamčeno</td>,
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
