// Test survey at /dotaznik/anketa, run next to the main /dotaznik.
// Branches on two answers: whether people know wide phones, and whether they are interested.
// Answers go to the same table as the main survey, kept apart by `slug`.
import type { Answers, OpenQuestion, Option, Question, SurveyDef } from './survey';

export const ANKETA_TEXT = {
  title: 'Co říkáte na telefon se širším displejem?',
  intro:
    'Zajímá nás váš názor na nový typ smartphonu. Je to klasický telefon, který se neskládá, jen má širší displej než telefony, na které jsme dnes zvyklí.',
  time: 'Většinou stačí klikat a zabere to 2-4 minuty. Odpovědi jsou anonymní.',
  formatNote:
    'Ani jeden z telefonů se neskládá. Široký telefon má displej v poměru zhruba 16:10 nebo 16:9, běžné telefony kolem 20:9. Obrázek ukazuje jen rozdíl v šířce, ne skutečnou velikost.',
  start: 'Přejít k otázkám',
  thanksTitle: 'Děkujeme za vaše odpovědi',
  thanks: 'Pomůžou nám pochopit, jaký telefon lidé v Česku opravdu chtějí.',
  thanksContact: 'Kvůli setkání se vám ozveme na kontakt, který jste nám nechali.',
  description: 'Krátký průzkum o telefonech se širším displejem. Zabere 2-4 minuty.',
  consent:
    'Souhlasím, aby mě Jswin s.r.o., distributor OPPO v České republice, kontaktoval kvůli setkání k tomuto průzkumu. Kontakt po jeho skončení smažeme.',
} as const;

const MAX = (n: number) => `Vyberte nejvýš ${n}.`;

// ---------- Option sets shared by more branches ----------

const BENEFITS: Option[] = [
  { value: 'obsah', label: 'Víc obsahu najednou (web, e-maily, dokumenty)' },
  { value: 'video', label: 'Lepší sledování videí' },
  { value: 'multitasking', label: 'Pohodlnější práce s více aplikacemi' },
  { value: 'psani', label: 'Pohodlnější psaní' },
  { value: 'sirka', label: 'Víc místa na šířku pro hry a mapy' },
];

const WORRIES: Option[] = [
  { value: 'sirka', label: 'Bude moc široký do ruky nebo do kapsy' },
  { value: 'cena', label: 'Bude moc drahý na to, co nabízí' },
  { value: 'prakticky', label: 'Nevím, jestli bude takový formát praktický' },
  { value: 'baterie', label: 'Horší výdrž baterie' },
  { value: 'aplikace', label: 'Aplikace na něm nebudou vypadat dobře' },
];

const CHANNELS: Option[] = [
  { value: 'weby', label: 'České weby o technologiích (Svět Androida, Mobilizujeme, Živě.cz)' },
  { value: 'youtube', label: 'Recenze na YouTube' },
  { value: 'socialni', label: 'Krátká videa na sociálních sítích (Instagram, TikTok, Facebook)' },
  { value: 'fora', label: 'Diskuze na Redditu a českých fórech' },
  { value: 'eshopy', label: 'Stránky a doporučení e-shopů jako Alza nebo Datart' },
  { value: 'emaily', label: 'E-maily od značek a obchodů' },
  { value: 'prodejna', label: 'Rada prodavače v kamenném obchodě' },
  { value: 'pratele', label: 'Doporučení od přátel a rodiny' },
];

const PRICES: Option[] = [
  { value: '30plus', label: '30 000 Kč a víc' },
  { value: '25_30', label: '25 000-30 000 Kč' },
  { value: '20_25', label: '20 000-25 000 Kč' },
  { value: '15_20', label: '15 000-20 000 Kč' },
  { value: '10_15', label: '10 000-15 000 Kč' },
  { value: '7_10', label: '7 000-10 000 Kč' },
];

const BRANDS: Option[] = [
  { value: 'samsung', label: 'Samsung' },
  { value: 'apple', label: 'Apple' },
  { value: 'xiaomi', label: 'Xiaomi' },
  { value: 'oppo', label: 'OPPO' },
  { value: 'google', label: 'Google' },
];

const A = 'Slyšeli o širokých telefonech';
const A_YES = 'Slyšeli o nich a zajímají je, nebo jsou neutrální';
const A_NO = 'Slyšeli o nich, ale nezajímají je';
const B = 'Slyší o nich poprvé';

export const ANKETA_QUESTIONS: Question[] = [
  // ---------- Everyone ----------
  {
    id: 'age',
    section: 'vsichni',
    short: 'Věk',
    kind: 'single',
    style: 'list',
    grid: true,
    title: 'Kolik vám je let?',
    options: [
      { value: '18_26', label: '18-26' },
      { value: '27_40', label: '27-40' },
      { value: '41_54', label: '41-54' },
      { value: '55plus', label: '55 a víc' },
    ],
  },
  {
    id: 'aware',
    section: 'vsichni',
    short: 'Zná široké telefony',
    kind: 'single',
    style: 'list',
    title: 'Slyšeli jste už o telefonech se širším displejem?',
    options: [
      { value: 'dost', label: 'Ano, vím o nich docela dost' },
      { value: 'doslech', label: 'Jen tak z doslechu' },
      { value: 'ne', label: 'Ne, slyším o nich poprvé' },
    ],
  },

  // ---------- Heard of them ----------
  {
    id: 'channels_rank',
    section: 'zna',
    audience: A,
    short: 'Zdroje informací (pořadí)',
    kind: 'rank',
    title: 'Kde hledáte informace o telefonech? Seřaďte zdroje podle toho, jak jsou pro vás důležité.',
    help: 'Vybírejte od nejdůležitějšího, čísla se doplní sama. Stačí zdroje, které opravdu používáte.',
    options: CHANNELS,
    check: { id: 'operator_call', short: 'Volal operátor', label: 'Už mi někdy volal operátor s nabídkou nového telefonu' },
  },
  {
    id: 'interest',
    section: 'zna',
    audience: A,
    short: 'Zájem',
    kind: 'single',
    style: 'list',
    title: 'Zajímá vás telefon se širším displejem?',
    options: [
      { value: 'ano', label: 'Ano, zajímá mě' },
      { value: 'neutral', label: 'Ani ano, ani ne' },
      { value: 'ne', label: 'Ne, nezajímá mě' },
    ],
  },

  // ---------- Heard of them and interested or neutral ----------
  {
    id: 'benefits',
    section: 'zajem',
    audience: A_YES,
    short: 'Přínosy',
    kind: 'multi',
    max: 3,
    title: 'Co by vám širší displej mohl přinést v běžném dni?',
    help: MAX(3),
    options: [
      ...BENEFITS,
      { value: 'cteni', label: 'Pohodlnější čtení knih a dokumentů' },
      { value: 'jine', label: 'Něco jiného', other: 'Napište co' },
      { value: 'nevim', label: 'Nevím, musím ho nejdřív vidět', exclusive: true },
    ],
  },
  {
    id: 'concerns',
    section: 'zajem',
    audience: A_YES,
    short: 'Obavy',
    kind: 'multi',
    max: 3,
    title: 'Čeho se u širokého telefonu nejvíc obáváte?',
    help: MAX(3),
    options: [
      ...WORRIES,
      { value: 'servis', label: 'Horší dostupnost servisu a oprav' },
      { value: 'jine', label: 'Něco jiného', other: 'Napište čeho' },
      { value: 'nevim', label: 'Nevím, musím ho nejdřív vyzkoušet', exclusive: true },
    ],
  },
  {
    id: 'features',
    section: 'zajem',
    audience: A_YES,
    short: 'Na čem záleží',
    kind: 'multi',
    max: 3,
    title: 'Na čem vám u širokého telefonu záleží nejvíc?',
    help: MAX(3),
    options: [
      { value: 'displej', label: 'Kvalita displeje (jas, barvy, šetrnost k očím)' },
      { value: 'baterie', label: 'Výdrž baterie' },
      { value: 'foto', label: 'Fotoaparát' },
      { value: 'vykon', label: 'Výkon a plynulost' },
      { value: 'ergonomie', label: 'Hmotnost a jak se drží v ruce' },
      { value: 'multitasking', label: 'Rozdělená obrazovka a práce s více aplikacemi' },
      { value: 'design', label: 'Design a zpracování' },
      { value: 'jine', label: 'Něco jiného', other: 'Napište co' },
    ],
  },
  {
    id: 'compromise',
    section: 'zajem',
    audience: A_YES,
    short: 'Kde nešetřit',
    kind: 'multi',
    max: 2,
    title: 'Kdyby se kvůli ceně muselo někde ušetřit, co by vám vadilo nejvíc?',
    help: MAX(2),
    options: [
      { value: 'baterie', label: 'Menší baterie, aby byl telefon tenčí' },
      { value: 'foto', label: 'Slabší fotoaparát' },
      { value: 'ram', label: 'Méně operační paměti (RAM)' },
      { value: 'nabijeni', label: 'Pomalejší nabíjení' },
      { value: 'drzeni', label: 'Horší držení v ruce kvůli šířce' },
      { value: 'displej', label: 'Horší displej (rozlišení, jas, ochrana očí)' },
      { value: 'nic', label: 'Nic z toho, hlavně ať je cena rozumná', exclusive: true },
    ],
  },
  {
    id: 'memory',
    section: 'zajem',
    audience: A_YES,
    short: 'Paměť',
    kind: 'single',
    style: 'list',
    grid: true,
    title: 'Jakou variantu paměti byste chtěli?',
    help: 'První číslo je operační paměť (RAM), druhé místo na fotky, aplikace a data.',
    options: [
      { value: '8_256', label: '8 GB + 256 GB' },
      { value: '8_512', label: '8 GB + 512 GB' },
      { value: '12_256', label: '12 GB + 256 GB' },
      { value: '12_512', label: '12 GB + 512 GB' },
      { value: 'cena', label: 'Nevím, záleží na ceně' },
    ],
  },
  {
    id: 'brand_pref',
    section: 'zajem',
    audience: A_YES,
    short: 'Značka pro široký telefon',
    kind: 'single',
    style: 'list',
    grid: true,
    title: 'Od které značky byste si široký telefon koupili nejraději?',
    options: [
      { value: 'oppo', label: 'OPPO' },
      { value: 'samsung', label: 'Samsung' },
      { value: 'apple', label: 'Apple' },
      { value: 'xiaomi', label: 'Xiaomi' },
      { value: 'google', label: 'Google' },
      { value: 'jina', label: 'Jiná značka', other: 'Která?' },
      { value: 'jedno', label: 'Na značce nezáleží, rozhoduje telefon' },
    ],
  },

  // ---------- Heard of them, not interested ----------
  {
    id: 'not_reason',
    section: 'nezajem',
    audience: A_NO,
    short: 'Proč nezajímá',
    kind: 'single',
    style: 'list',
    title: 'Proč vás široký telefon nezajímá? Vyberte hlavní důvod.',
    options: [
      { value: 'staci', label: 'Nepřijde mi praktický, můj telefon mi stačí' },
      { value: 'sirka', label: 'Je moc široký do ruky i do kapsy' },
      { value: 'cena', label: 'Čekám, že bude zbytečně drahý' },
      { value: 'riziko', label: 'Nevím, jestli bude dobře fungovat, nechci riskovat' },
      { value: 'osvedcene', label: 'Novinky nezkouším, držím se osvědčeného' },
      { value: 'nevim', label: 'Nevím' },
    ],
  },
  {
    id: 'reconsider',
    section: 'nezajem',
    audience: A_NO,
    short: 'Co by změnilo názor',
    kind: 'single',
    style: 'list',
    title: 'Co by vás mohlo přimět o něm uvažovat?',
    options: [
      { value: 'cena', label: 'Cena jako u běžného telefonu' },
      { value: 'vraceni', label: 'Možnost ho vyzkoušet a bez udání důvodu vrátit' },
      { value: 'okoli', label: 'Dobré zkušenosti někoho, koho znám' },
      { value: 'vyuziti', label: 'Jasné využití, které by se mi hodilo' },
      { value: 'servis', label: 'Spolehlivý servis a záruka' },
      { value: 'nevim', label: 'Nevím' },
    ],
  },

  // ---------- Hearing of them for the first time ----------
  {
    id: 'appeal',
    section: 'nezna',
    audience: B,
    short: 'Co láká',
    kind: 'multi',
    max: 2,
    title: 'Co by vás na širokém telefonu mohlo lákat?',
    help: MAX(2),
    options: [
      ...BENEFITS,
      { value: 'nevim', label: 'Nevím, musím ho nejdřív vidět', exclusive: true },
      { value: 'nic', label: 'Nic mě na něm neláká', exclusive: true },
    ],
  },
  {
    id: 'worry',
    section: 'nezna',
    audience: B,
    short: 'Největší obava',
    kind: 'single',
    style: 'list',
    title: 'Čeho byste se u něj nejvíc obávali?',
    options: [...WORRIES, { value: 'nevim', label: 'Nevím, musím ho nejdřív vyzkoušet' }],
  },
  {
    id: 'interest_after',
    section: 'nezna',
    audience: B,
    short: 'Zájem po představení',
    kind: 'single',
    style: 'list',
    title: 'Teď, když víte, o co jde, zajímal by vás takový telefon?',
    options: [
      { value: 'hodne', label: 'Ano, hodně' },
      { value: 'spis_ano', label: 'Spíš ano' },
      { value: 'neutral', label: 'Ani ano, ani ne' },
      { value: 'spis_ne', label: 'Spíš ne' },
      { value: 'vubec', label: 'Vůbec ne' },
    ],
  },
  {
    id: 'channels',
    section: 'nezna',
    audience: B,
    short: 'Zdroje informací',
    kind: 'multi',
    max: 3,
    title: 'Kde se obvykle dozvídáte o nových telefonech?',
    help: MAX(3),
    options: CHANNELS,
  },

  // ---------- Price and buying (asked in more branches) ----------
  {
    id: 'price_expect',
    section: 'nakup',
    audience: A_YES,
    short: 'Očekávaná cena',
    kind: 'single',
    style: 'list',
    grid: true,
    title: 'Kdyby telefon splnil vaše očekávání, v jaké ceně byste ho čekali?',
    options: PRICES,
  },
  {
    id: 'price_fair',
    section: 'nakup',
    audience: `${A_NO} + ${B.toLowerCase()}`,
    short: 'Rozumná cena',
    kind: 'single',
    style: 'list',
    grid: true,
    title: 'Kolik by podle vás měl stát široký telefon se střední výbavou?',
    options: PRICES,
  },
  {
    id: 'launch_offer',
    section: 'nakup',
    audience: `${A_YES} + ${B.toLowerCase()}`,
    short: 'Bonus při uvedení',
    kind: 'multi',
    max: 2,
    title: 'Co by vás přesvědčilo koupit si ho hned po uvedení na trh?',
    help: MAX(2),
    options: [
      { value: 'darek', label: 'Dárek v hodnotě 2 000-4 000 Kč, třeba sluchátka nebo hodinky' },
      { value: 'vykup', label: 'Bonus 2 000-4 000 Kč za výkup starého telefonu' },
      { value: 'sleva', label: 'Sleva 2 000-4 000 Kč rovnou z ceny' },
      { value: 'predobjednavka', label: 'Sleva 2 000-4 000 Kč za předobjednávku' },
      { value: 'splatky', label: 'Splátky bez navýšení' },
      { value: 'pojisteni', label: 'Pojištění displeje nebo baterie, případně delší záruka' },
      { value: 'recenze', label: 'Dárek za napsání recenze' },
    ],
  },
  {
    id: 'when_buy',
    section: 'nakup',
    audience: A_YES,
    short: 'Kdy by koupil(a)',
    kind: 'single',
    style: 'list',
    title: 'Kdy byste si ho nejspíš koupili?',
    options: [
      { value: 'hned', label: 'Hned po uvedení na trh' },
      { value: 'potreba', label: 'Až budu potřebovat nový telefon (ten starý se rozbije, ztratí nebo zpomalí)' },
      { value: 'sleva', label: 'Počkám na slevu nebo rozumnější cenu' },
    ],
  },
  {
    id: 'shops',
    section: 'nakup',
    short: 'Kde kupuje',
    kind: 'multi',
    grid: true,
    title: 'Kde obvykle kupujete telefony?',
    help: 'Můžete vybrat víc.',
    options: [
      { value: 'alza', label: 'Alza' },
      { value: 'datart', label: 'Datart' },
      { value: 'operator', label: 'U operátora (T-Mobile, O2, Vodafone)' },
      { value: 'eshop_znacky', label: 'Na e-shopu výrobce' },
      { value: 'prodejna_znacky', label: 'V prodejně značky' },
      { value: 'mp', label: 'Mobil Pohotovost' },
      { value: 'huramobil', label: 'Huramobil' },
      { value: 'jine', label: 'Jinde', other: 'Kde?' },
    ],
  },
  {
    id: 'reassure',
    section: 'nakup',
    audience: `${A_YES} + ${B.toLowerCase()}`,
    short: 'Co dodá jistotu',
    kind: 'multi',
    max: 2,
    title: 'Co by vám dodalo jistotu u takhle nového typu telefonu?',
    help: MAX(2),
    options: [
      { value: 'servis', label: 'Servis v Česku a snadné opravy' },
      { value: 'podpora', label: 'Zákaznická podpora v češtině' },
      { value: 'operatori', label: 'Prodej u českých operátorů, i na splátky' },
      { value: 'vraceni', label: 'Možnost ho vyzkoušet a bez udání důvodu vrátit' },
      { value: 'recenze', label: 'Skutečné recenze a testy od uživatelů' },
      { value: 'povest', label: 'Dobrá pověst značky v inovacích' },
      { value: 'okoli', label: 'Doporučení od někoho z okolí, kdo ho používá' },
      { value: 'nevim', label: 'Nevím', exclusive: true },
    ],
  },
  {
    id: 'brand_now',
    section: 'vsichni',
    short: 'Značka teď',
    kind: 'single',
    style: 'list',
    grid: true,
    title: 'Jakou značku telefonu teď používáte?',
    options: [...BRANDS, { value: 'jina', label: 'Jinou', other: 'Jakou?' }],
  },
  {
    id: 'meet',
    section: 'setkani',
    audience: `${A_YES} + ${B.toLowerCase()}`,
    short: 'Setkání',
    kind: 'single',
    style: 'list',
    title: 'Chtěli byste si s námi o tomhle tématu popovídat osobně?',
    lead: 'Jsme Jswin, oficiální distributor OPPO pro Českou republiku. Rádi bychom široké telefony probrali s některými z vás i naživo.',
    options: [
      { value: 'ano', label: 'Ano, nechám vám kontakt' },
      { value: 'mozna', label: 'Možná, záleží na tom, kdy to bude' },
      { value: 'ne', label: 'Raději ne' },
    ],
  },
];

/** The optional message at the end. Free text, not a Question. */
export const MESSAGE = {
  id: 'message',
  label: 'Chcete výrobcům širokých telefonů ještě něco vzkázat?',
  placeholder: 'Napište cokoli, co vás napadne.',
} as const;

// ---------- Branching ----------

const START = ['age', 'aware'];
const HEARD = [...START, 'channels_rank', 'interest'];
const INTERESTED = [
  ...HEARD,
  'benefits', 'concerns', 'features', 'compromise', 'memory', 'brand_pref', 'price_expect',
  'launch_offer', 'when_buy', 'shops', 'reassure', 'brand_now', 'meet', MESSAGE.id,
];
// The ranking question already covered where they look for information, so it is not asked again here.
const NOT_INTERESTED = [...HEARD, 'not_reason', 'reconsider', 'price_fair', 'shops', 'brand_now', MESSAGE.id];
const FIRST_TIME = [
  ...START,
  'appeal', 'worry', 'interest_after', 'price_fair', 'launch_offer', 'channels', 'shops', 'reassure', 'brand_now', 'meet', MESSAGE.id,
];

/** Questions this person sees, in order. Ends at the next unanswered branching question. */
export function anketaFlow(a: Answers): string[] {
  if (!a.aware) return START;
  if (a.aware === 'ne') return FIRST_TIME;
  if (!a.interest) return HEARD;
  return a.interest === 'ne' ? NOT_INTERESTED : INTERESTED;
}

/** Length of the whole path, guessing the longest branch while it is still open (for the progress bar). */
export function anketaLength(a: Answers): number {
  if (!a.aware || (a.aware !== 'ne' && !a.interest)) return INTERESTED.length;
  return anketaFlow(a).length;
}

/** Free text: the closing message, plus the text field of every "something else" option. */
export const otherKey = (questionId: string) => `${questionId}_jine`;
const OPEN: OpenQuestion[] = [
  { id: MESSAGE.id, label: 'Vzkaz výrobcům' },
  ...ANKETA_QUESTIONS.flatMap((q) =>
    q.kind !== 'matrix' && q.options.some((o) => o.other) ? [{ id: otherKey(q.id), label: `${q.short}: jiné` }] : [],
  ),
];

/** Phone number or e-mail typed at the meeting question. */
export function contactKind(raw: string): 'email' | 'phone' | null {
  const v = raw.trim();
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return 'email';
  if (/^\+?\d{9,15}$/.test(v.replace(/[\s\-().]/g, ''))) return 'phone';
  return null;
}

export const ANKETA: SurveyDef = {
  slug: 'wide-2026-anketa-2',
  title: ANKETA_TEXT.title,
  adminTitle: 'Anketa: telefon se širším displejem',
  path: '/dotaznik/anketa',
  name: 'Anketa',
  questions: ANKETA_QUESTIONS,
  sections: {
    vsichni: 'Všichni',
    zna: 'Slyšeli o širokých telefonech',
    zajem: 'Slyšeli o nich a mají zájem nebo jsou neutrální',
    nezajem: 'Slyšeli o nich, ale nezajímají je',
    nezna: 'Slyší o nich poprvé',
    nakup: 'Cena a nákup',
    setkani: 'Osobní setkání',
  },
  open: OPEN,
  meeting: {
    cols: ['age', 'aware', 'interest', 'interest_after', 'brand_now'],
    maybeLabel: 'odpovědělo „možná“ a nechalo kontakt',
    phoneOrEmail: true,
  },
  newsletter: true,
  filters: ['aware', 'interest', 'age'],
  flow: anketaFlow,
};
