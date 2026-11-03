// Everything about the contest that may change lives here.

export const CONTEST = {
  name: 'Lovci světla',
  fullName: 'OPPO Photo Contest: Lovci světla',
  hashtag: '#OPPOLovciSvetla',
  oppoHashtag: '#ShotOnOPPO',
  instagramHandle: process.env.NEXT_PUBLIC_IG_HANDLE || 'oppo_cesko',

  // Times are Prague time (CET, UTC+1 in November).
  start: '2026-11-04T09:00:00+01:00',
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

// Photo walk with Martin Rak. Hidden page /photowalk, admin /admin/photowalk.
export const PHOTOWALK = {
  // Stored with every sign-up, so a future walk can reuse the same table.
  slug: 'vysehrad-2026-11-14',
  title: 'OPPO Photo Walk s Martinem Rakem',
  // Prague time (CET, UTC+1 in November).
  start: '2026-11-14T14:00:00+01:00',
  end: '2026-11-14T17:00:00+01:00',
  signupEnd: '2026-11-07T23:59:59+01:00',
  capacity: 12,
  place: 'Vista House',
  address: 'Na Pankráci 30, Praha 4',
  transport: 'kousek od metra C Vyšehrad',
  // For participants on the day: running late, can't find the place, can't come.
  contactPhone: '+420 777 834 042',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Vista+House%2C+Na+Pank%C3%A1ci+30%2C+Praha+4',
  photographer: {
    name: 'Martin Rak',
    instagram: 'https://www.instagram.com/martinrakphoto/',
    web: 'https://www.martinrak.cz/',
  },
  brands: ['OPPO', 'OnePlus'],
  voucher: 'Voucher 500 Kč na e-shop OPPO při nákupu od 4 000 Kč',
  program: [
    { time: '14:00', title: 'Káva a tipy od Martina', text: 'Sraz ve Vista House. Martin na vlastních fotkách ukáže, jak telefonem fotit krajinu, architekturu, detaily i vzdálené motivy přes zoom.' },
    { time: '14:30', title: 'Procházka po Vyšehradě', text: 'Zhruba 2,5 km v klidném tempu. Na každé zastávce se zaměříme na něco jiného.' },
    { time: '16:30', title: 'Zpátky v teple: vaše fotky a otázky', text: 'Káva, občerstvení a to nejlepší, co jste nafotili. Martin snímky okomentuje a nejlepší ocení na místě. Končíme v 17:00.' },
  ],
  stops: [
    { name: 'Vista House', theme: 'sraz, úvod a briefing' },
    { name: 'Rotunda sv. Martina', theme: 'historická architektura a detaily' },
    { name: 'Cihelná brána a Gorlice', theme: 'hradby, struktury a světlo' },
    { name: 'Karlachovy sady', theme: 'příroda, podzim a portréty' },
    { name: 'Bazilika sv. Petra a Pavla', theme: 'kompozice a perspektiva' },
    { name: 'Vyhlídka Vyšehrad', theme: 'Vltava, Praha a foto challenge' },
    { name: 'Parkem zpět', theme: 'volné focení cestou zpátky' },
  ],
} as const;

// Organizer of the contest and controller of personal data (from ARES).
export const ORGANIZER = {
  name: 'Jswin s.r.o.',
  ico: '23452111',
  address: 'Na Pankráci 1618/30, Nusle, 140 00 Praha 4',
  register: 'zapsaná v obchodním rejstříku vedeném Městským soudem v Praze, oddíl C, vložka 427159',
  email: 'ahoj@opposoutez.cz',
} as const;

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
