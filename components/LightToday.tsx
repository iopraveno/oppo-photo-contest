'use client';

import { useEffect, useState } from 'react';
import { dayLabel, hhmm, lightDay, lightNow, range } from '@/lib/light';

// Relative widths of the phases on the bar. Blue hours last ~15 minutes, so the bar shows the order of the light,
// not a linear clock: each phase gets enough room for its label.
const COLS = [7, 12, 14, 34, 14, 12, 7];
const PHASES = ['night', 'blue', 'gold', 'day', 'gold', 'blue', 'night'] as const;
const TWO_HOURS = 2 * 60 * 60 * 1000;

/** Where "now" sits on the bar, in percent, or null when it is outside it. */
function nowPosition(now: number, edges: number[]) {
  let left = 0;
  for (let i = 0; i < COLS.length; i++) {
    const [a, b] = [edges[i], edges[i + 1]];
    if (now >= a && now < b) return left + (COLS[i] * (now - a)) / (b - a);
    left += COLS[i];
  }
  return null;
}

export default function LightToday({ initialNow }: { initialNow: number }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const t = lightDay(now);
  const edges = [t.dawn - TWO_HOURS, t.dawn, t.morningBlueEnd, t.morningGoldenEnd, t.eveningGoldenStart, t.eveningBlueStart, t.dusk, t.dusk + TWO_HOURS];
  const pos = nowPosition(now, edges);

  return (
    <section className="light" aria-labelledby="light-title">
      <div className="container">
        <div className="light-head">
          <div>
            <h2 id="light-title" className="light-title">Světlo dnes v Praze</h2>
            <p className="light-day">{dayLabel(now)}</p>
          </div>
          <p className="light-now" aria-live="polite">{lightNow(now)}</p>
        </div>

        <div className="light-bar" style={{ gridTemplateColumns: COLS.map((c) => `${c}fr`).join(' ') }} aria-hidden="true">
          {PHASES.map((p, i) => (
            <span key={i} className={`light-seg ${p}`} />
          ))}
          {pos !== null && (
            <span className="light-marker" style={{ left: `${pos}%` }}>
              <span>{hhmm(now)}</span>
            </span>
          )}
        </div>

        <ul className="light-legend" style={{ gridTemplateColumns: COLS.map((c) => `${c}fr`).join(' ') }}>
          <li className="blue" style={{ gridColumn: 2 }}><strong>Modrá hodina</strong>{range(t.dawn, t.morningBlueEnd)}</li>
          <li className="gold" style={{ gridColumn: 3 }}><strong>Zlatá hodina</strong>{range(t.morningBlueEnd, t.morningGoldenEnd)}</li>
          <li className="day" style={{ gridColumn: 4 }}><strong>Slunce nad obzorem</strong>{range(t.sunrise, t.sunset)}</li>
          <li className="gold" style={{ gridColumn: 5 }}><strong>Zlatá hodina</strong>{range(t.eveningGoldenStart, t.eveningBlueStart)}</li>
          <li className="blue" style={{ gridColumn: 6 }}><strong>Modrá hodina</strong>{range(t.eveningBlueStart, t.dusk)}</li>
        </ul>
        <p className="light-note">Časy platí pro Prahu. Na Ostravsku je všechno asi o čtvrt hodiny dřív, na Chebsku asi o deset minut později.</p>
      </div>
    </section>
  );
}
