// Server-rendered charts for /admin/dotaznik. Plain HTML bars: hover shows the exact numbers.
import type { Count, RankCount } from '@/lib/survey-data';
import s from './admin.module.css';

const pct = (n: number, of: number) => (of ? Math.round((n / of) * 100) : 0);

/** One bar per option. Single choice: shares add up to 100 %. Multi choice: share of respondents. */
export function BarList({ counts, total, colors }: { counts: Count[]; total: number; colors?: Record<string, string> }) {
  const max = Math.max(1, ...counts.map((c) => c.count));
  return (
    <div className={s.bars}>
      {counts.map((c) => {
        const p = pct(c.count, total);
        return (
          <div key={c.value} className={s.barRow} title={`${c.label}: ${c.count} z ${total} (${p} %)`}>
            <span className={s.barLabel}>{c.label}</span>
            <span className={s.barTrack}>
              <span
                className={s.bar}
                style={{ width: `${(c.count / max) * 100}%`, background: colors?.[c.value] }}
              />
            </span>
            <span className={s.barValue}>
              <b>{p} %</b> <span className={s.barCount}>{c.count}</span>
            </span>
          </div>
        );
      })}
    </div>
  );
}

/** Two shades of the single-series green: the dark part (ranked first) sits inside the light part (picked at all). */
const RANK_FIRST = '#2d683d';
const RANK_ANY = '#b3d4bc';
const avgFmt = new Intl.NumberFormat('cs-CZ', { maximumFractionDigits: 1 });

/** Ranking question: per item, the share who put it first and the share who picked it at all, both out of all who answered. */
export function RankList({ counts, total }: { counts: RankCount[]; total: number }) {
  return (
    <div>
      <div className={s.legend}>
        <span className={s.legendItem}>
          <span className={s.swatch} style={{ background: RANK_FIRST }} />
          Na 1. místě
        </span>
        <span className={s.legendItem}>
          <span className={s.swatch} style={{ background: RANK_ANY }} />
          Vybrali vůbec
        </span>
      </div>
      <div className={s.bars}>
        {counts.map((c) => {
          const first = pct(c.first, total);
          const any = pct(c.count, total);
          const avg = c.avgPos === null ? '-' : avgFmt.format(c.avgPos);
          return (
            <div
              key={c.value}
              className={`${s.barRow} ${s.rankRow}`}
              title={`${c.label}: na 1. místě ${c.first} z ${total} (${first} %), vybralo ${c.count} (${any} %), průměrné pořadí ${avg}`}
            >
              <span className={s.barLabel}>{c.label}</span>
              <span className={`${s.barTrack} ${s.rankTrack}`}>
                <span className={s.bar} style={{ width: `${any}%`, background: RANK_ANY }} />
                <span className={s.bar} style={{ width: `${first}%`, background: RANK_FIRST }} />
              </span>
              <span className={s.barValue}>
                <b>{first} %</b> <span className={s.barCount}>/ {any} %</span>
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export type Column = { value: string; label: string; color: string; dark?: boolean };

/** One 100 % bar per row, segments in column order. */
export function StackedRows({
  rows,
  columns,
}: {
  rows: { value: string; label: string; counts: Count[]; answered: number }[];
  columns: Column[];
}) {
  return (
    <div>
      <div className={s.legend}>
        {columns.map((c) => (
          <span key={c.value} className={s.legendItem}>
            <span className={s.swatch} style={{ background: c.color }} />
            {c.label}
          </span>
        ))}
      </div>
      <div className={s.stacks}>
        {rows.map((r) => (
          <div key={r.value} className={s.stackRow}>
            <span className={s.barLabel}>{r.label}</span>
            <span className={s.stack}>
              {r.counts.map((c) => {
                const col = columns.find((x) => x.value === c.value)!;
                const p = pct(c.count, r.answered);
                if (!c.count) return null;
                return (
                  <span
                    key={c.value}
                    className={s.segment}
                    style={{ flexGrow: c.count, background: col.color, color: col.dark ? '#fff' : '#111' }}
                    title={`${r.label}: ${c.label} ${p} % (${c.count} z ${r.answered})`}
                  >
                    {p >= 9 ? `${p} %` : ''}
                  </span>
                );
              })}
              {r.answered === 0 && <span className={s.empty}>bez odpovědí</span>}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** Light-to-dark steps of one blue for ordered scales (price bands). Validated as an ordinal ramp. */
export const ORDINAL = ['#86b6ef', '#5598e7', '#2a78d6', '#1c5cab', '#104281'];
/** Fixed identity colours for the three shapes and "no difference" (categorical slots 1-4). */
export const SHAPE_COLORS: Record<string, string> = { A: '#2a78d6', B: '#eb6834', C: '#1baf7a', stejne: '#eda100', nevim: '#b9b8b2' };
