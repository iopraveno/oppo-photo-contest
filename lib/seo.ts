import type { Metadata } from 'next';
import { CONTEST, SITE_URL, SOCIALS } from './config';
import { clockTime, longDate } from './contest';

export const SITE_NAME = 'OPPO Lovci světla';
export const DEFAULT_TITLE = `${CONTEST.name} | OPPO Photo Contest 2026`;
export const DEFAULT_DESCRIPTION =
  `Fotosoutěž OPPO ${CONTEST.name} (${CONTEST.dateRangeLabel}): vyfoť zimní světlo, sdílej ho na Instagramu s ${CONTEST.hashtag} ` +
  'a nech komunitu hlasovat. Hraje se o OPPO Find X10, OPPO Watch S a OPPO Enco Air5 Pro.';

export const OG_IMAGE = {
  url: '/img/og.jpg',
  width: 1200,
  height: 630,
  alt: `OPPO Photo Contest ${CONTEST.name}, ${CONTEST.dateRangeLabel}`,
};

/**
 * Title, description, canonical address and social share tags for one page.
 * Pass image: false when the route has its own opengraph-image file.
 */
export function pageMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  path,
  image = OG_IMAGE,
  noindex = false,
}: {
  title?: string;
  description?: string;
  path: string;
  image?: typeof OG_IMAGE | false;
  noindex?: boolean;
}): Metadata {
  const fullTitle = title ? `${title} | ${SITE_NAME}` : DEFAULT_TITLE;
  return {
    title: title ?? { absolute: DEFAULT_TITLE },
    description,
    alternates: { canonical: path },
    robots: noindex ? { index: false, follow: false } : undefined,
    openGraph: {
      type: 'website',
      locale: 'cs_CZ',
      siteName: SITE_NAME,
      url: path,
      title: fullTitle,
      description,
      ...(image ? { images: [image] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      ...(image ? { images: [image.url] } : {}),
    },
  };
}

/** Questions answered on the homepage, also published as FAQPage structured data. */
export function faqItems(): { q: string; a: string }[] {
  const h = CONTEST.instagramHandle;
  const [first, second, third] = CONTEST.milestones;
  return [
    {
      q: `Co je soutěž ${CONTEST.name}?`,
      a:
        `Fotosoutěž OPPO pro všechny, kdo fotí mobilem. Od ${longDate(CONTEST.start)} ${clockTime(CONTEST.start)} do ${longDate(CONTEST.entriesEnd)} 2026 ` +
        `sdílíš na Instagramu fotky zimního světla s hashtagem ${CONTEST.hashtag}. O vítězích nerozhoduje porota, ale hlasování komunity na tomto webu.`,
    },
    {
      q: 'Jak se do soutěže zapojím?',
      a:
        `Zveřejni fotku na svém veřejném Instagramu, přidej ${CONTEST.hashtag} a označ @${h}, který musíš sledovat. ` +
        'Fotka musí patřit do jednoho ze čtyř témat. Žádné formuláře ani registrace, fotku do galerie přidáme sami zpravidla do 24 hodin.',
    },
    {
      q: 'Jaká jsou soutěžní témata?',
      a: `${CONTEST.themes.map((t) => t.title).join('; ')}.`,
    },
    {
      q: 'Musím fotit na telefon OPPO?',
      a:
        `Ne, soutěžit může fotka z jakéhokoli mobilu. Majitelé telefonů OPPO a OnePlus přidají ještě ${CONTEST.oppoHashtag} ` +
        `a soutěží navíc o zvláštní cenu: ${CONTEST.oppoPrize.toLowerCase()}.`,
    },
    {
      q: 'Co se dá vyhrát?',
      a:
        `Ceny se odemykají podle počtu soutěžících. Od začátku se hraje o ${first.prize}, od ${second.at} soutěžících přibude ${second.prize} ` +
        `a od ${third.at} soutěžících hlavní cena ${third.prize}. Výherce Find X10 do dvou týdnů natočí video se zkušenostmi s telefonem.`,
    },
    {
      q: 'Kdo může hlasovat a kolikrát?',
      a:
        'Kdokoli, kdo se na webu přihlásí ověřeným e-mailem, bez hesla, jen jednorázovým kódem. Každé fotce můžeš dát jeden hlas ' +
        `a podpořit můžeš libovolný počet fotek. Hlasování končí ${longDate(CONTEST.votingEnd)} 2026 ve 23:59.`,
    },
    {
      q: 'Kolik fotek můžu do soutěže poslat?',
      a:
        `Nejvýš jednu fotku týdně, celkem ${CONTEST.maxEntriesPerPerson}. Jeden příspěvek obsahuje jednu fotku, ne album ani story. ` +
        'Běžné úpravy jsou v pořádku, fotky vytvořené nebo upravené generativní AI ne.',
    },
    {
      q: 'Kdo se může zúčastnit?',
      a: 'Lidé starší 18 let s bydlištěm v České republice a veřejným účtem na Instagramu.',
    },
    {
      q: 'Kdy se dozvím výsledky?',
      a: `Vítěze vyhlásíme ${longDate(CONTEST.winnersDate)} 2026 na Instagramu @${h} a výherce kontaktujeme zprávou na Instagramu.`,
    },
  ];
}

/** Structured data for the homepage: the site, the organizer, the contest as an event and the FAQ. */
export function homeJsonLd() {
  const org = {
    '@type': 'Organization',
    '@id': `${SITE_URL}/#oppo`,
    name: 'OPPO Česko',
    url: 'https://www.oppo.com/cz/',
    logo: `${SITE_URL}/img/oppo-logo.png`,
    sameAs: SOCIALS.map((s) => s.url),
  };
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'WebSite', '@id': `${SITE_URL}/#web`, name: SITE_NAME, url: SITE_URL, inLanguage: 'cs-CZ', publisher: { '@id': org['@id'] } },
      org,
      {
        '@type': 'Event',
        '@id': `${SITE_URL}/#soutez`,
        name: CONTEST.fullName,
        description: DEFAULT_DESCRIPTION,
        url: SITE_URL,
        image: [`${SITE_URL}${OG_IMAGE.url}`],
        startDate: CONTEST.start,
        endDate: CONTEST.votingEnd,
        eventStatus: 'https://schema.org/EventScheduled',
        eventAttendanceMode: 'https://schema.org/OnlineEventAttendanceMode',
        location: { '@type': 'VirtualLocation', url: SITE_URL },
        isAccessibleForFree: true,
        inLanguage: 'cs-CZ',
        organizer: { '@id': org['@id'] },
        keywords: [CONTEST.hashtag, CONTEST.oppoHashtag, 'fotosoutěž', 'mobilní fotografie', 'OPPO Find X10'].join(', '),
      },
      {
        '@type': 'FAQPage',
        '@id': `${SITE_URL}/#faq`,
        mainEntity: faqItems().map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
      },
    ],
  };
}

/** Plain-language summary for AI assistants and search engines (served as /llms.txt). */
export function llmsText() {
  const h = CONTEST.instagramHandle;
  const lines = [
    `# ${CONTEST.fullName}`,
    '',
    `> Fotosoutěž OPPO Česko pro mobilní fotografy. Soutěžící sdílejí fotky zimního světla na Instagramu s ${CONTEST.hashtag} a označením @${h}, o vítězích rozhoduje hlasování komunity na ${SITE_URL}.`,
    '',
    '## Termíny',
    `- Start: ${longDate(CONTEST.start)} 2026 v ${clockTime(CONTEST.start)} (Praha)`,
    `- Poslední den pro nové fotky: ${longDate(CONTEST.entriesEnd)} 2026, 23:59`,
    `- Konec hlasování: ${longDate(CONTEST.votingEnd)} 2026, 23:59`,
    `- Vyhlášení vítězů: ${longDate(CONTEST.winnersDate)} 2026 na Instagramu @${h}`,
    '',
    '## Jak se zapojit',
    `- Fotka na veřejném Instagramu s ${CONTEST.hashtag}, označený a sledovaný účet @${h}`,
    `- Jedna fotka v příspěvku, nejvýš jedna týdně a celkem ${CONTEST.maxEntriesPerPerson}; jakýkoli mobil; bez generativní AI`,
    `- Majitelé OPPO a OnePlus přidají ${CONTEST.oppoHashtag} a soutěží i o zvláštní cenu (${CONTEST.oppoPrize.toLowerCase()})`,
    '- Účastníci: 18+, bydliště v ČR',
    '',
    '## Témata',
    ...CONTEST.themes.map((t) => `- ${t.title}: ${t.text}`),
    '',
    '## Výhry (odemykají se podle počtu soutěžících)',
    ...CONTEST.milestones.map((m) => `- od ${m.at} soutěžících: ${m.prize}`),
    '',
    '## Hlasování',
    '- Hlasuje kdokoli s e-mailem ověřeným jednorázovým kódem; jeden hlas na fotku, libovolný počet fotek',
    '',
    '## Odkazy',
    `- Galerie: ${SITE_URL}/galerie`,
    `- Žebříček: ${SITE_URL}/zebricek`,
    `- Pravidla: ${SITE_URL}/pravidla`,
    `- Instagram: https://www.instagram.com/${h}/`,
  ];
  return lines.join('\n') + '\n';
}
