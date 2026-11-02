import { CONTEST } from './config';

export type Phase = 'before' | 'entries' | 'voting' | 'ended';

export function getPhase(now = new Date()): Phase {
  if (now < new Date(CONTEST.start)) return 'before';
  if (now <= new Date(CONTEST.entriesEnd)) return 'entries';
  if (now <= new Date(CONTEST.votingEnd)) return 'voting';
  return 'ended';
}

export function isVotingOpen(now = new Date()) {
  const phase = getPhase(now);
  return phase === 'entries' || phase === 'voting';
}

/** Prizes for 1st, 2nd, 3rd place given the number of entrants. */
export function prizesFor(entrants: number): string[] {
  const unlocked = CONTEST.milestones.filter((m) => entrants >= m.at).map((m) => m.prize);
  return unlocked.reverse(); // best prize first
}

export function nextMilestone(entrants: number) {
  return CONTEST.milestones.find((m) => entrants < m.at) ?? null;
}

const dateFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', timeZone: 'Europe/Prague' });
const dateLongFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'long', timeZone: 'Europe/Prague' });

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { hour: 'numeric', minute: '2-digit', timeZone: 'Europe/Prague' });

/** Clock time in Prague, e.g. "9:00". */
export function clockTime(iso: string) {
  return timeFmt.format(new Date(iso));
}

export function shortDate(iso: string) {
  return dateFmt.format(new Date(iso));
}

export function longDate(iso: string) {
  return dateLongFmt.format(new Date(iso));
}

/** Czech plural: 1 hlas, 2–4 hlasy, 5+ hlasů */
export function plural(n: number, one: string, few: string, many: string) {
  if (n === 1) return one;
  if (n >= 2 && n <= 4) return few;
  return many;
}
