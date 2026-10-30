// Everything about the contest that may change lives here.

export const CONTEST = {
  name: 'Lovci světla',
  fullName: 'OPPO Photo Contest: Lovci světla',
  hashtag: '#OPPOLovciSvetla',
  oppoHashtag: '#ShotOnOPPO',
  instagramHandle: process.env.NEXT_PUBLIC_IG_HANDLE || 'OPPO_CZ_HANDLE',

  // Times are Prague time (CET, UTC+1 in November).
  start: '2026-11-04T00:00:00+01:00',
  entriesEnd: '2026-11-24T23:59:59+01:00',
  votingEnd: '2026-11-26T23:59:59+01:00',
  winnersDate: '2026-11-27T12:00:00+01:00',
  dateRangeLabel: '4.–24. listopadu 2026',

  maxEntriesPerPerson: 3,

  // Prize pool grows with the number of entrants (unique Instagram accounts with an approved photo).
  milestones: [
    { at: 0, prize: 'OPPO Enco Air5 Pro' },
    { at: 50, prize: 'OPPO Watch S' },
    { at: 150, prize: 'OPPO Find X10' },
  ],
  oppoPrize: 'Poukaz 2 000 Kč na příslušenství v e-shopu OPPO',
} as const;

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export function instagramProfileUrl(handle: string) {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}
