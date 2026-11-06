'use client';

import { useEffect, useState } from 'react';
import { dayLabel, hhmm, lightDay, lightNow, range } from '@/lib/light';

// The bar shows the order of the light, not a linear clock: blue hours last ~15 minutes, so every phase gets
// a fixed share of the width, enough for its label. Inside a phase the position is linear in time.
const PHASES = [
  { tone: 'night', cols: 7 },
  { tone: 'blue', cols: 12, name: 'Modrá hodina' },
  { tone: 'gold', cols: 14, name: 'Zlatá hodina' },
  { tone: 'day', cols: 34, name: 'Denní světlo' },
  { tone: 'gold', cols: 14, name: 'Zlatá hodina' },
  { tone: 'blue', cols: 12, name: 'Modrá hodina' },
  { tone: 'night', cols: 7 },
] as const;
const COLUMNS = PHASES.map((p) => `${p.cols}fr`).join(' ');
const TWO_HOURS = 2 * 60 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

/** Where a moment sits on the bar, in percent, or null when it is outside it. */
function position(ms: number, edges: number[]) {
  let left = 0;
  for (let i = 0; i < PHASES.length; i++) {
    const [a, b] = [edges[i], edges[i + 1]];
    if (ms >= a && ms < b) return left + (PHASES[i].cols * (ms - a)) / (b - a);
    left += PHASES[i].cols;
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

  // After dusk today's light is spent, and the sentence already talks about tomorrow, so the bar does too.
  const tomorrow = now >= lightDay(now).dusk;
  const t = lightDay(now, tomorrow ? 1 : 0);
  const edges = [t.dawn - TWO_HOURS, t.dawn, t.morningBlueEnd, t.morningGoldenEnd, t.eveningGoldenStart, t.eveningBlueStart, t.dusk, t.dusk + TWO_HOURS];
  const pos = position(now, edges);
  const passed = pos ?? (now >= edges[edges.length - 1] ? 100 : 0);
  const sunTicks = [t.sunrise, t.sunset].map((ms) => position(ms, edges));
  const state = (i: number) => (now >= edges[i + 1] ? 'past' : now >= edges[i] ? 'now' : 'next');

  const legend = [
    { i: 1, time: range(t.dawn, t.morningBlueEnd) },
    { i: 2, time: range(t.morningBlueEnd, t.morningGoldenEnd), sun: `východ slunce ${hhmm(t.sunrise)}` },
    { i: 3, time: range(t.morningGoldenEnd, t.eveningGoldenStart) },
    { i: 4, time: range(t.eveningGoldenStart, t.eveningBlueStart), sun: `západ slunce ${hhmm(t.sunset)}` },
    { i: 5, time: range(t.eveningBlueStart, t.dusk) },
  ];

  return (
    <section className="light" aria-labelledby="light-title">
      <div className="container">
        <div className="light-head">
          <h2 id="light-title" className="light-title">{tomorrow ? 'Světlo zítra v Praze' : 'Světlo dnes v Praze'}</h2>
          <p className="light-day">{dayLabel(tomorrow ? now + DAY : now)}</p>
        </div>
        <p className="light-now" aria-live="polite">
          {lightNow(now).map((c, i) =>
            c.tone ? (
              <span key={i} className={`light-tone-${c.tone}`}>{c.text}</span>
            ) : (
              <span key={i}>{c.text}</span>
            ),
          )}
        </p>

        <div className="light-bar" aria-hidden="true">
          <div className="light-track" style={{ gridTemplateColumns: COLUMNS }}>
            {PHASES.map((p, i) => (
              <span key={i} className={`light-seg ${p.tone}`} />
            ))}
            {sunTicks.map((x, i) => (x === null ? null : <span key={`sun${i}`} className="light-sun" style={{ left: `${x}%` }} />))}
            <span className="light-passed" style={{ width: `${passed}%` }} />
          </div>
          {pos !== null && (
            <span className={`light-marker${pos < 5 ? ' at-start' : pos > 95 ? ' at-end' : ''}`} style={{ left: `${pos}%` }}>
              <span>{hhmm(now)}</span>
            </span>
          )}
        </div>

        <ul className="light-legend" style={{ gridTemplateColumns: COLUMNS }}>
          {legend.map(({ i, time, sun }) => {
            const phase = PHASES[i];
            const s = state(i);
            return (
              <li key={i} className={`${phase.tone} is-${s}`} style={{ gridColumn: i + 1 }} aria-current={s === 'now' ? 'time' : undefined}>
                <strong>
                  <span className="light-swatch" aria-hidden="true" />
                  {'name' in phase ? phase.name : ''}
                </strong>
                <span className="light-time">{time}</span>
                {sun && <span className="light-sunline">{sun}</span>}
              </li>
            );
          })}
        </ul>
        <p className="light-note">Časy platí pro Prahu. Na Ostravsku je všechno asi o čtvrt hodiny dřív, na Chebsku asi o deset minut později.</p>
      </div>
    </section>
  );
}
