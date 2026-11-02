// Everything about the contest that may change lives here.

export const CONTEST = {
  name: 'Lovci světla',
  fullName: 'OPPO Photo Contest: Lovci světla',
  hashtag: '#OPPOLovciSvetla',
  oppoHashtag: '#ShotOnOPPO',
  instagramHandle: process.env.NEXT_PUBLIC_IG_HANDLE || 'oppo_cesko',

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

  // Allowed themes. Sample photos live in public/img/temata/<slug>.jpg (see public/img/README.md).
  themes: [
    {
      slug: 'zlata-hodina',
      title: 'Zlatá hodina a západy slunce',
      text: 'Hodina před západem, kdy je světlo nízké a teplé. Dlouhé stíny, siluety, obloha od žluté po fialovou.',
      tip: 'V listopadu slunce zapadá kolem čtvrté, zlatá hodina začíná už po třetí.',
    },
    {
      slug: 'modra-hodina',
      title: 'Modrá hodina a světla města',
      text: 'Chvíle po západu, kdy obloha zmodrá a rozsvítí se lampy, výlohy a okna. Odrazy na mokré dlažbě.',
      tip: 'Opři telefon o zábradlí nebo zeď, ať je snímek ostrý i při delší expozici.',
    },
    {
      slug: 'mlha',
      title: 'Mlha, inverze a první mráz',
      text: 'Ranní mlha v údolí, inverze nad městem, jinovatka na trávě a větvích. Ticho, vrstvy, jemné přechody.',
      tip: 'Nejlepší mlha bývá hodinu po rozednění. Vyplatí se vstát.',
    },
    {
      slug: 'zoom',
      title: 'Detaily z dálky',
      text: 'Teleobjektiv a to, co pouhým okem nevidíte: věž na obzoru, pták na drátu, okno v protějším domě, měsíc nad střechami.',
      tip: 'Zkus 3× až 10× zoom a hledej jednoduchou kompozici s jedním hlavním motivem.',
    },
  ],
} as const;

export type Theme = (typeof CONTEST.themes)[number];

export const SOCIALS = [
  { name: 'Instagram', url: 'https://www.instagram.com/oppo_cesko/' },
  { name: 'Facebook', url: 'https://www.facebook.com/oppocesko/' },
  { name: 'YouTube', url: 'https://www.youtube.com/@OPPOCesko' },
  { name: 'TikTok', url: 'https://www.tiktok.com/@oppocesko' },
] as const;

// Public address of the site. Falls back to the production domain Vercel assigns (custom domain if one is attached).
const vercelProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : '';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || vercelProductionUrl || 'http://localhost:3000').replace(/\/$/, '');

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || '';

export function instagramProfileUrl(handle: string) {
  return `https://www.instagram.com/${encodeURIComponent(handle)}/`;
}
