// Wide phone survey (/dotaznik, admin /admin/dotaznik).
// One definition drives the page, the server-side check, the admin charts and the CSV export.
// Values are stored in the database; labels can change without breaking old answers.

export const SURVEY = {
  slug: 'wide-2026',
  title: 'Co když bude telefon širší?',
  description: 'Krátký dotazník OPPO o tom, jaký telefon chcete mít v ruce příště. Stačí zaklikávat, zabere to maximálně 5 minut.',
  minutes: 5,
} as const;

export type Shape = 'A' | 'B' | 'C';
export type SectionId = 'tvar' | 'cena' | 'pamet' | 'nakup' | 'vy';

export const SECTIONS: Record<string, string> = {
  tvar: 'Tvar',
  cena: 'Cena',
  pamet: 'Paměť',
  nakup: 'Nákup',
  vy: 'O vás',
};

export type Option = {
  value: string;
  label: string;
  /** Picking it clears the other choices (e.g. "Nothing"). */
  exclusive?: boolean;
  /** Draws the phone outline next to the option. */
  shape?: Shape;
  /** Memory options: how full the little phone next to the label is drawn (0-1). */
  level?: number;
};

/** short: column name in the admin table and the CSV. */
type Base = { id: string; section: string; title: string; short: string; help?: string };

export type SingleQuestion = Base & {
  kind: 'single';
  style: 'list' | 'tiles' | 'shapes' | 'scale' | 'storage';
  options: Option[];
};
export type MultiQuestion = Base & { kind: 'multi'; options: Option[]; max?: number; ranked?: boolean; previousId?: string };

/** A ranking must contain every regular option once, or one exclusive opt-out. */
export function isCompleteRanking(q: MultiQuestion, value: unknown): value is string[] {
  if (!Array.isArray(value) || !value.length || new Set(value).size !== value.length) return false;
  if (!value.every((v) => typeof v === 'string' && q.options.some((o) => o.value === v))) return false;
  const exclusive = value.some((v) => q.options.find((o) => o.value === v)?.exclusive);
  return exclusive ? value.length === 1 : value.length === q.options.filter((o) => !o.exclusive).length;
}
export type MatrixQuestion = Base & {
  kind: 'matrix';
  style: 'shapes' | 'scale';
  rows: { value: string; label: string }[];
  columns: Option[];
};
export type Question = SingleQuestion | MultiQuestion | MatrixQuestion;

export const SHAPES: { shape: Shape; name: string; text: string }[] = [
  { shape: 'A', name: 'Klasický', text: 'Jako většina dnešních telefonů.' },
  { shape: 'B', name: 'Široký', text: 'Širší a kratší, tvarem blíž cestovnímu pasu. Neskládá se.' },
  { shape: 'C', name: 'Široký skládací', text: 'Zavřený jako B, otevřený jako malý tablet.' },
];

const PRICE_PAID: Option[] = [
  { value: 'do5', label: 'Do 5 000 Kč' },
  { value: '5_10', label: '5 000-10 000 Kč' },
  { value: '10_20', label: '10 000-20 000 Kč' },
  { value: '20_30', label: '20 000-30 000 Kč' },
  { value: '30_40', label: '30 000-40 000 Kč' },
  { value: '40plus', label: 'Víc než 40 000 Kč' },
  { value: 'nevim', label: 'Nevím, dostal(a) jsem ho' },
];

export const QUESTIONS: Question[] = [
  // ---------- Tvar ----------
  {
    id: 'pick',
    short: 'Vybral(a) by',
    section: 'tvar',
    kind: 'single',
    style: 'shapes',
    title: 'Kdyby všechny tři stály stejně, který byste si vybrali?',
    options: [
      { value: 'A', label: 'Klasický', shape: 'A' },
      { value: 'B', label: 'Široký', shape: 'B' },
      { value: 'C', label: 'Široký skládací', shape: 'C' },
      { value: 'nevim', label: 'Nevím' },
    ],
  },
  {
    id: 'held',
    short: 'Držel(a) v ruce',
    section: 'tvar',
    kind: 'multi',
    title: 'Měli jste už některý z nich v ruce?',
    help: 'Můžete vybrat víc.',
    options: [
      { value: 'B', label: 'Ano, široký (B)', shape: 'B' },
      { value: 'C', label: 'Ano, široký skládací (C)', shape: 'C' },
      { value: 'zadny', label: 'Ani jeden', exclusive: true },
    ],
  },
  {
    id: 'best_for',
    short: 'Nejlepší na',
    section: 'tvar',
    kind: 'matrix',
    style: 'shapes',
    title: 'Který tvar je podle vás nejlepší na…',
    rows: [
      { value: 'foceni', label: 'Focení' },
      { value: 'video', label: 'Filmy, video a hry' },
      { value: 'prace', label: 'Práce, e-maily a dokumenty' },
      { value: 'kapsa', label: 'Nošení v kapse' },
      { value: 'jednaruka', label: 'Ovládání jednou rukou' },
      { value: 'odolnost', label: 'Odolnost a spolehlivost' },
    ],
    columns: [
      { value: 'A', label: 'Klasický', shape: 'A' },
      { value: 'B', label: 'Široký', shape: 'B' },
      { value: 'C', label: 'Skládací', shape: 'C' },
      { value: 'stejne', label: 'Bez rozdílu' },
    ],
  },
  {
    id: 'attract',
    short: 'Láká',
    section: 'tvar',
    kind: 'multi',
    max: 3,
    title: 'Co vás na širokém telefonu láká?',
    help: 'Vyberte nejvýš 3.',
    options: [
      { value: 'fotky', label: 'Víc místa na prohlížení a úpravy fotek' },
      { value: 'nahled', label: 'Větší náhled při focení' },
      { value: 'video', label: 'Filmy, video a hry' },
      { value: 'dve_aplikace', label: 'Dvě aplikace vedle sebe' },
      { value: 'cteni', label: 'Čtení, mapy a dokumenty' },
      { value: 'klavesnice', label: 'Širší klávesnice, lépe se píše' },
      { value: 'tablet', label: 'Rozložený displej jako tablet (C)' },
      { value: 'novinka', label: 'Je to něco nového' },
      { value: 'nic', label: 'Nic mě neláká', exclusive: true },
    ],
  },
  {
    id: 'deter',
    short: 'Odrazuje',
    section: 'tvar',
    kind: 'multi',
    max: 3,
    title: 'A co vás od něj odrazuje?',
    help: 'Vyberte nejvýš 3.',
    options: [
      { value: 'cena', label: 'Cena' },
      { value: 'sirka', label: 'Moc široký do ruky nebo do kapsy' },
      { value: 'jednaruka', label: 'Hůř se ovládá jednou rukou' },
      { value: 'baterie', label: 'Výdrž baterie' },
      { value: 'aplikace', label: 'Aplikace na něj nemusí být uzpůsobené' },
      { value: 'foto', label: 'Horší fotoaparát než u nejlepších klasických telefonů' },
      { value: 'hmotnost', label: 'Tloušťka a hmotnost (C)' },
      { value: 'pant', label: 'Obava o pant a odolnost (C)' },
      { value: 'ryha', label: 'Rýha v ohybu displeje (C)' },
      { value: 'oprava', label: 'Cena opravy' },
      { value: 'vyuziti', label: 'Nevím, k čemu bych ho využil(a)' },
      { value: 'nic', label: 'Nic mě neodrazuje', exclusive: true },
    ],
  },

  // ---------- Cena ----------
  {
    id: 'paid_now',
    short: 'Současný telefon stál',
    section: 'cena',
    kind: 'single',
    style: 'scale',
    title: 'Kolik stál váš současný telefon?',
    options: PRICE_PAID,
  },
  {
    id: 'budget_next',
    short: 'Rozpočet na příští',
    section: 'cena',
    kind: 'single',
    style: 'scale',
    title: 'Kolik jste ochotni dát za příští telefon?',
    options: [
      { value: 'do10', label: 'Do 10 000 Kč' },
      { value: '10_20', label: '10 000-20 000 Kč' },
      { value: '20_30', label: '20 000-30 000 Kč' },
      { value: '30_40', label: '30 000-40 000 Kč' },
      { value: '40plus', label: 'Víc než 40 000 Kč' },
    ],
  },
  {
    id: 'premium',
    short: 'Příplatek za širší tvar',
    section: 'cena',
    kind: 'matrix',
    style: 'scale',
    title: 'Kolik byste za širší tvar připlatili oproti klasickému telefonu?',
    rows: [
      { value: 'B', label: 'Široký (B)' },
      { value: 'C', label: 'Široký skládací (C)' },
    ],
    columns: [
      { value: 'nic', label: 'Nic' },
      { value: 'do5', label: 'Do 5 000 Kč' },
      { value: '5_10', label: '5 000-10 000 Kč' },
      { value: '10_15', label: '10 000-15 000 Kč' },
      { value: '15plus', label: 'Víc než 15 000 Kč' },
    ],
  },
  {
    id: 'deal',
    short: 'Co přesvědčí',
    section: 'cena',
    kind: 'single',
    style: 'list',
    title: 'Ceny telefonů rostou. Co by vás při nákupu přesvědčilo nejvíc?',
    options: [
      { value: 'cena', label: 'Nižší cena, i bez bonusů' },
      { value: 'darek', label: 'Dárek k telefonu' },
      { value: 'vykup', label: 'Bonus za starý telefon' },
      { value: 'splatky', label: 'Splátky 0 %' },
      { value: 'zaruka', label: 'Delší záruka' },
    ],
  },

  // ---------- Paměť ----------
  {
    id: 'storage_now',
    short: 'Paměť teď',
    section: 'pamet',
    kind: 'single',
    style: 'storage',
    title: 'Kolik paměti má váš současný telefon?',
    help: 'Myslíme úložiště na fotky, videa a aplikace.',
    options: [
      { value: '64', label: '64 GB a méně', level: 0.15 },
      { value: '128', label: '128 GB', level: 0.3 },
      { value: '256', label: '256 GB', level: 0.5 },
      { value: '512', label: '512 GB', level: 0.75 },
      { value: '1tb', label: '1 TB', level: 1 },
      { value: 'nevim', label: 'Nevím' },
    ],
  },
  {
    id: 'storage_next',
    short: 'Paměť příště',
    section: 'pamet',
    kind: 'single',
    style: 'storage',
    title: 'Kolik paměti byste chtěli v příštím telefonu?',
    options: [
      { value: '128', label: '128 GB', level: 0.3 },
      { value: '256', label: '256 GB', level: 0.5 },
      { value: '512', label: '512 GB', level: 0.75 },
      { value: '1tb', label: '1 TB', level: 1 },
      { value: 'jedno', label: 'Je mi to jedno' },
    ],
  },
  {
    id: 'storage_full',
    short: 'Došla paměť',
    section: 'pamet',
    kind: 'single',
    style: 'list',
    title: 'Došla vám někdy v telefonu paměť?',
    options: [
      { value: 'casto', label: 'Ano, často' },
      { value: 'obcas', label: 'Občas' },
      { value: 'nikdy', label: 'Nikdy' },
      { value: 'nevim', label: 'Nevím' },
    ],
  },
  {
    id: 'storage_use',
    short: 'Co zabírá místo',
    section: 'pamet',
    kind: 'multi',
    title: 'Co vám v telefonu zabírá nejvíc místa?',
    help: 'Můžete vybrat víc.',
    options: [
      { value: 'fotky', label: 'Fotky' },
      { value: 'videa', label: 'Videa' },
      { value: 'aplikace', label: 'Aplikace a hry' },
      { value: 'zpravy', label: 'Zprávy a WhatsApp' },
      { value: 'offline', label: 'Hudba a filmy stažené offline' },
      { value: 'nevim', label: 'Nevím', exclusive: true },
    ],
  },
  {
    id: 'cloud',
    short: 'Cloud',
    section: 'pamet',
    kind: 'single',
    style: 'list',
    title: 'Zálohujete fotky a videa do cloudu?',
    options: [
      { value: 'plati', label: 'Ano, platím si víc místa' },
      { value: 'zdarma', label: 'Ano, ve verzi zdarma' },
      { value: 'ne', label: 'Ne' },
      { value: 'nevim', label: 'Nevím' },
    ],
  },
  {
    id: 'storage_pay',
    short: 'Příplatek za 2× paměť',
    section: 'pamet',
    kind: 'single',
    style: 'scale',
    title: 'Kolik byste připlatili za dvojnásobnou paměť?',
    help: 'Třeba 512 GB místo 256 GB.',
    options: [
      { value: 'nic', label: 'Nic' },
      { value: 'do1', label: 'Do 1 000 Kč' },
      { value: '1_2', label: '1 000-2 000 Kč' },
      { value: '2_4', label: '2 000-4 000 Kč' },
      { value: '4plus', label: 'Víc než 4 000 Kč' },
    ],
  },
  {
    id: 'ram_care',
    short: 'Řeší RAM',
    section: 'pamet',
    kind: 'single',
    style: 'list',
    title: 'Řešíte při výběru telefonu velikost RAM?',
    help: 'Operační paměť. Ovlivňuje, jak svižně telefon běží a kolik aplikací udrží otevřených.',
    options: [
      { value: 'hodne', label: 'Ano, hodně' },
      { value: 'trochu', label: 'Trochu' },
      { value: 'ne', label: 'Ne, neřeším' },
      { value: 'nevim', label: 'Nevím, co to je' },
    ],
  },
  {
    id: 'ram_ideal',
    short: 'Ideální RAM',
    section: 'pamet',
    kind: 'single',
    style: 'storage',
    title: 'Kolik RAM je pro vás ideální?',
    options: [
      { value: '8', label: '8 GB', level: 0.3 },
      { value: '12', label: '12 GB', level: 0.5 },
      { value: '16', label: '16 GB', level: 0.75 },
      { value: '24', label: '24 GB a víc', level: 1 },
      { value: 'nevim', label: 'Nevím' },
    ],
  },
  {
    id: 'ram_pay',
    short: 'Příplatek za RAM',
    section: 'pamet',
    kind: 'single',
    style: 'scale',
    title: 'Kolik byste připlatili za víc RAM?',
    help: 'Třeba 16 GB místo 12 GB.',
    options: [
      { value: 'nic', label: 'Nic' },
      { value: 'do1', label: 'Do 1 000 Kč' },
      { value: '1_2', label: '1 000-2 000 Kč' },
      { value: '2_3', label: '2 000-3 000 Kč' },
      { value: '3plus', label: 'Víc než 3 000 Kč' },
    ],
  },

  // ---------- Nákup ----------
  {
    id: 'where',
    short: 'Kde koupí',
    section: 'nakup',
    kind: 'single',
    style: 'list',
    title: 'Kde byste takový telefon nejspíš koupili?',
    options: [
      { value: 'vyrobce', label: 'Na e-shopu výrobce' },
      { value: 'alza', label: 'Alza' },
      { value: 'mp', label: 'Mobil Pohotovost' },
      { value: 'operator', label: 'U operátora' },
      { value: 'eshop', label: 'Jiný e-shop' },
      { value: 'prodejna', label: 'V kamenné prodejně' },
    ],
  },
  {
    id: 'online',
    short: 'Online bez vyzkoušení',
    section: 'nakup',
    kind: 'single',
    style: 'list',
    title: 'Koupili byste ho online, aniž byste ho drželi v ruce?',
    options: [
      { value: 'ano', label: 'Ano' },
      { value: 'vraceni', label: 'Jen když ho půjde bez problémů vrátit' },
      { value: 'ne', label: 'Ne, musím ho nejdřív držet v ruce' },
    ],
  },
  {
    id: 'trust',
    short: 'Čí názor rozhodne',
    section: 'nakup',
    kind: 'multi',
    max: 2,
    title: 'Čí názor by pro vás při výběru rozhodl?',
    help: 'Vyberte nejvýš 2.',
    options: [
      { value: 'youtube', label: 'Recenze na YouTube' },
      { value: 'weby', label: 'Technologické weby a magazíny' },
      { value: 'influenceri', label: 'Influenceři na sítích' },
      { value: 'prodavac', label: 'Prodavač v obchodě' },
      { value: 'blizci', label: 'Kamarádi a rodina' },
      { value: 'hodnoceni', label: 'Hodnocení zákazníků, třeba na Heurece' },
    ],
  },
  {
    id: 'doubt',
    short: 'Co vezme obavu',
    section: 'nakup',
    kind: 'single',
    style: 'list',
    title: 'Co by vám vzalo poslední obavu z nového tvaru?',
    options: [
      { value: 'vymena', label: 'Výměna, když si na tvar nezvyknu' },
      { value: 'zaruka', label: 'Delší záruka' },
      { value: 'servis', label: 'Rychlý servis v Česku' },
      { value: 'vyzkouseni', label: 'Možnost vyzkoušet si ho v obchodě' },
      { value: 'pojisteni', label: 'Pojištění displeje' },
    ],
  },

  // ---------- O vás ----------
  {
    id: 'phone',
    short: 'Telefon',
    section: 'vy',
    kind: 'single',
    style: 'tiles',
    title: 'Jaký telefon teď používáte?',
    options: [
      { value: 'iphone', label: 'iPhone' },
      { value: 'samsung', label: 'Samsung' },
      { value: 'xiaomi', label: 'Xiaomi' },
      { value: 'oppo', label: 'OPPO' },
      { value: 'oneplus', label: 'OnePlus' },
      { value: 'pixel', label: 'Google Pixel' },
      { value: 'jiny', label: 'Jiný' },
    ],
  },
  {
    id: 'age',
    short: 'Věk',
    section: 'vy',
    kind: 'single',
    style: 'tiles',
    title: 'Kolik vám je let?',
    options: [
      { value: 'u18', label: 'Do 18' },
      { value: '18_24', label: '18-24' },
      { value: '25_34', label: '25-34' },
      { value: '35_44', label: '35-44' },
      { value: '45_54', label: '45-54' },
      { value: '55plus', label: '55 a víc' },
    ],
  },
  {
    id: 'when',
    short: 'Kdy kupuje',
    section: 'vy',
    kind: 'single',
    style: 'list',
    title: 'Kdy plánujete nový telefon?',
    options: [
      { value: '3m', label: 'Do 3 měsíců' },
      { value: '6m', label: 'Do půl roku' },
      { value: '12m', label: 'Do roka' },
      { value: 'ne', label: 'Zatím neplánuji' },
    ],
  },
];

/** Optional free-text questions on the last screen. */
export const OPEN_QUESTIONS = [
  { id: 'need', label: 'Co by musel široký telefon splnit, abyste ho chtěli místo klasického?' },
  { id: 'message', label: 'Chcete nám ještě něco vzkázat?' },
] as const;

export const OPEN_MAX = 1000;

export type MatrixValue = Record<string, string>;
export type AnswerValue = string | string[] | MatrixValue;
export type Answers = Record<string, AnswerValue>;
export type OpenAnswers = Partial<Record<string, string>>;
export type OpenQuestion = { id: string; label: string };

/** Everything the admin, the CSV export and the server check need to know about one survey. */
export type SurveyDef = {
  slug: string;
  title: string;
  path: string;
  /** Short name in the admin switch. */
  name: string;
  questions: Question[];
  /** Retired questions: keep historical responses readable in tables and exports. */
  archivedQuestions?: Question[];
  sections: Record<string, string>;
  open: readonly OpenQuestion[];
  /** Asks for an in-person meeting and e-mail at the end. */
  meeting: boolean;
  /** Optional OPPO newsletter opt-in, independent of meeting invitations. */
  newsletter?: boolean;
  /** Question ids offered as filters in the admin. */
  filters: string[];
};

export function isAnswered(q: Question, v: AnswerValue | undefined): boolean {
  if (v === undefined) return false;
  if (q.kind === 'single') return typeof v === 'string' && v.length > 0;
  if (q.kind === 'multi') return q.ranked ? isCompleteRanking(q, v) : Array.isArray(v) && v.length > 0;
  return typeof v === 'object' && !Array.isArray(v) && q.rows.every((r) => typeof v[r.value] === 'string');
}

/** Children stay anonymous: no contact step for the under-18 answer. */
export const canLeaveContact = (answers: Answers) => answers.age !== 'u18';

export function labelOf(q: Question, value: string): string {
  const list = q.kind === 'matrix' ? q.columns : q.options;
  return list.find((o) => o.value === value)?.label ?? value;
}

/** Human-readable answer for the table and CSV. */
export function formatAnswer(q: Question, v: AnswerValue | undefined): string {
  if (v === undefined) return '';
  if (q.kind === 'single') return typeof v === 'string' ? labelOf(q, v) : '';
  if (q.kind === 'multi') {
    if (!Array.isArray(v)) return '';
    return v.map((x, i) => {
      const rank = q.ranked && !q.options.find((o) => o.value === x)?.exclusive ? `${i + 1}. ` : '';
      return `${rank}${labelOf(q, x)}`;
    }).join(q.ranked ? '; ' : ', ');
  }
  if (typeof v !== 'object' || Array.isArray(v)) return '';
  return q.rows.map((r) => `${r.label}: ${v[r.value] ? labelOf(q, v[r.value]) : '-'}`).join('; ');
}

/** Keep pre-ranking responses readable without assigning them a fictitious order. */
export function formatResponseAnswer(q: Question, answers: Answers): string {
  if (q.kind === 'multi' && q.ranked && answers[q.id] === undefined && q.previousId && answers[q.previousId] !== undefined) {
    return `Dřívější výběr bez pořadí: ${formatAnswer({ ...q, ranked: false }, answers[q.previousId])}`;
  }
  return formatAnswer(q, answers[q.id]);
}

/**
 * Server-side check: keeps only known questions and options, and reports the first problem.
 * Returns cleaned answers so nothing unexpected reaches the database.
 */
export function cleanAnswers(raw: unknown, questions: Question[] = QUESTIONS): { answers: Answers; error?: string } {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const answers: Answers = {};
  for (const q of questions) {
    const v = input[q.id];
    if (q.kind === 'single') {
      if (typeof v !== 'string' || !q.options.some((o) => o.value === v)) return { answers, error: `Chybí odpověď: ${q.title}` };
      answers[q.id] = v;
    } else if (q.kind === 'multi') {
      if (q.ranked && !isCompleteRanking(q, v)) return { answers, error: `Seřaďte všechny možnosti: ${q.title}` };
      if (!Array.isArray(v) || v.length === 0) return { answers, error: `Chybí odpověď: ${q.title}` };
      const picked = [...new Set(v.filter((x): x is string => typeof x === 'string' && q.options.some((o) => o.value === x)))];
      if (picked.length === 0) return { answers, error: `Chybí odpověď: ${q.title}` };
      if (q.max && picked.length > q.max) return { answers, error: `Moc odpovědí: ${q.title}` };
      const exclusive = picked.filter((x) => q.options.find((o) => o.value === x)?.exclusive);
      answers[q.id] = exclusive.length ? [exclusive[0]] : picked;
    } else {
      const obj = (v && typeof v === 'object' && !Array.isArray(v) ? v : {}) as Record<string, unknown>;
      const row: MatrixValue = {};
      for (const r of q.rows) {
        const cell = obj[r.value];
        if (typeof cell !== 'string' || !q.columns.some((c) => c.value === cell)) return { answers, error: `Chybí odpověď: ${q.title}` };
        row[r.value] = cell;
      }
      answers[q.id] = row;
    }
  }
  return { answers };
}

export function cleanOpen(raw: unknown, open: readonly OpenQuestion[] = OPEN_QUESTIONS): OpenAnswers {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const out: OpenAnswers = {};
  for (const q of open) {
    const v = input[q.id];
    if (typeof v === 'string' && v.trim()) out[q.id] = v.trim().replace(/\r\n/g, '\n').slice(0, OPEN_MAX);
  }
  return out;
}

/** Where the visitor came from: ?src=... (influencer links) or utm_source. Short, URL-safe. */
export function cleanSource(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  return s.toLowerCase().replace(/[^a-z0-9_.-]/g, '').slice(0, 40) || 'primo';
}

/** The main survey at /dotaznik. */
export const MAIN_SURVEY: SurveyDef = {
  slug: SURVEY.slug,
  title: SURVEY.title,
  path: '/dotaznik',
  name: 'Hlavní dotazník',
  questions: QUESTIONS,
  sections: SECTIONS,
  open: OPEN_QUESTIONS,
  meeting: true,
  filters: ['phone', 'age', 'pick'],
};
