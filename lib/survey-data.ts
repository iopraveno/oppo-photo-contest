import 'server-only';
import { createAdminClient } from './supabase/admin';
import { isSupabaseConfigured } from './env';
import { MAIN_SURVEY, QUESTIONS, SURVEY, type Answers, type OpenAnswers, type Question, type SurveyDef } from './survey';
import { ANKETA } from './survey-anketa';
import { ANKETA_V1 } from './survey-anketa-v1';

export type SurveyResponse = {
  id: string;
  answers: Answers;
  open_answers: OpenAnswers;
  src: string;
  wants_meeting: boolean | null;
  email: string | null;
  contact_consent: boolean;
  duration_s: number | null;
  device: string | null;
  created_at: string;
};

/** src, device and meet are fixed; any other key is a question id with the picked value. */
export type SurveyFilters = Record<string, string | undefined>;

/** Surveys in the admin switch. key is ?verze= in the admin and typ= in the CSV export. */
export const SURVEY_VERSIONS: { key: string; exportType: string; file: string; def: SurveyDef }[] = [
  { key: '', exportType: 'dotaznik', file: 'dotaznik-siroke-telefony', def: MAIN_SURVEY },
  { key: 'anketa', exportType: 'anketa', file: 'anketa-siroky-displej', def: ANKETA },
  { key: 'anketa-v1', exportType: 'anketa-v1', file: 'anketa-novy-format-v1', def: ANKETA_V1 },
];

export const versionOf = (key: string | undefined | null) => SURVEY_VERSIONS.find((v) => v.key === (key || '')) ?? SURVEY_VERSIONS[0];
export const versionByExport = (typ: string | null) => SURVEY_VERSIONS.find((v) => v.exportType === typ);
export const surveyByVersion = (key: string | undefined): SurveyDef => versionOf(key).def;
export const adminHref = (key: string) => (key ? `/admin/dotaznik?verze=${key}` : '/admin/dotaznik');

/** null = the table is missing (supabase/dotaznik.sql not run yet). */
export async function listResponses(slug: string = SURVEY.slug): Promise<SurveyResponse[] | null> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createAdminClient();
  const rows: SurveyResponse[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase
      .from('survey_responses')
      .select('id, answers, open_answers, src, wants_meeting, email, contact_consent, duration_s, device, created_at')
      .eq('survey', slug)
      .order('created_at', { ascending: false })
      .range(from, from + 999);
    if (error) {
      if (error.code === '42P01' || /does not exist/i.test(error.message)) return null;
      console.error('survey list failed:', error.message);
      return rows;
    }
    rows.push(...((data ?? []) as SurveyResponse[]));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

export function applyFilters(rows: SurveyResponse[], f: SurveyFilters) {
  const questionFilters = Object.entries(f).filter(([k, v]) => v && !['src', 'device', 'meet'].includes(k));
  return rows.filter(
    (r) =>
      (!f.src || r.src === f.src) &&
      (!f.device || r.device === f.device) &&
      (!f.meet || (f.meet === 'ano' ? r.wants_meeting === true : r.wants_meeting !== true)) &&
      questionFilters.every(([k, v]) => r.answers[k] === v),
  );
}

export type Count = { value: string; label: string; count: number };

/** Single and multi questions: one count per option, in the question's own order. */
export function countOptions(rows: SurveyResponse[], q: Question): { counts: Count[]; answered: number } {
  if (q.kind === 'matrix') return { counts: [], answered: 0 };
  const counts = q.options.map((o) => ({ value: o.value, label: o.label, count: 0 }));
  let answered = 0;
  for (const r of rows) {
    const v = r.answers[q.id];
    const values = typeof v === 'string' ? [v] : Array.isArray(v) ? v : [];
    // Ranking summaries count the first choice; full order stays in the table/export.
    const picked = q.kind === 'multi' && q.ranked ? values.slice(0, 1) : values;
    if (picked.length) answered++;
    for (const p of picked) {
      const c = counts.find((x) => x.value === p);
      if (c) c.count++;
    }
  }
  return { counts, answered };
}

export type RankCount = Count & { first: number; avgPos: number | null };

/** Ranking questions: how many picked each item at all, how many put it first, and its average position. */
export function countRank(rows: SurveyResponse[], q: Question): { counts: RankCount[]; answered: number } {
  if (q.kind !== 'rank') return { counts: [], answered: 0 };
  const counts = q.options.map((o) => ({ value: o.value, label: o.label, count: 0, first: 0, sum: 0 }));
  let answered = 0;
  for (const r of rows) {
    const v = r.answers[q.id];
    if (!Array.isArray(v) || !v.length) continue;
    answered++;
    v.forEach((p, i) => {
      const c = counts.find((x) => x.value === p);
      if (!c) return;
      c.count++;
      c.sum += i + 1;
      if (i === 0) c.first++;
    });
  }
  return {
    answered,
    counts: counts
      .map(({ sum, ...c }) => ({ ...c, avgPos: c.count ? sum / c.count : null }))
      .sort((a, b) => b.first - a.first || b.count - a.count),
  };
}

/** Matrix questions: for each row, one count per column. */
export function countMatrix(rows: SurveyResponse[], q: Question) {
  if (q.kind !== 'matrix') return [];
  return q.rows.map((row) => {
    const counts = q.columns.map((c) => ({ value: c.value, label: c.label, count: 0 }));
    let answered = 0;
    for (const r of rows) {
      const v = r.answers[q.id];
      const cell = v && typeof v === 'object' && !Array.isArray(v) ? v[row.value] : undefined;
      const c = counts.find((x) => x.value === cell);
      if (c) {
        c.count++;
        answered++;
      }
    }
    return { value: row.value, label: row.label, counts, answered };
  });
}

export function sourceLabel(src: string) {
  if (src === 'primo') return 'Přímý odkaz';
  if (src === 'sdileni') return 'Sdílení z dotazníku';
  return src;
}

export function countSources(rows: SurveyResponse[]): Count[] {
  const map = new Map<string, number>();
  rows.forEach((r) => map.set(r.src, (map.get(r.src) ?? 0) + 1));
  return [...map.entries()].sort((a, b) => b[1] - a[1]).map(([value, count]) => ({ value, label: sourceLabel(value), count }));
}

export function median(values: number[]) {
  if (!values.length) return null;
  const v = [...values].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : Math.round((v[m - 1] + v[m]) / 2);
}

export const questionById = (id: string) => QUESTIONS.find((q) => q.id === id)!;
