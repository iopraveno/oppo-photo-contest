// Test survey at /dotaznik/anketa: a shorter poll with its own look, run next to the main /dotaznik.
// Answers go to the same table, kept apart by `slug`.
import type { Question, SurveyDef } from './survey';

export const ANKETA_TEXT = {
  title: 'Jak vnímáte nový formát smartphonu?',
  intro:
    'Představte si klasický smartphone, ale má širší tělo a méně protáhlý displej než běžné dnešní telefony. Zajímá nás, jak na vás tento nový formát působí a zda byste o něj měli zájem. Nemusíte mít s tímto typem telefonu žádné předchozí zkušenosti. Zajímá nás především váš osobní názor.',
  time: 'Vyplnění ankety vám zabere jen 2-3 minuty.',
  start: 'Přejít k otázkám',
  thanksTitle: 'Děkujeme za váš čas a odpovědi!',
  thanks: 'Vaše zpětná vazba nám pomůže lépe porozumět vašim potřebám a očekáváním od budoucích smartphonů OPPO. ❤️',
  description: 'Krátká anketa OPPO o širším formátu telefonu. Vyplnění zabere jen 2-3 minuty.',
} as const;

const ONE = 'Možnost vybrat jednu odpověď.';
const MORE = 'Možnost vybrat více odpovědí.';

export const ANKETA_QUESTIONS: Question[] = [
  {
    id: 'known',
    section: 'uvod',
    short: 'Zná široké telefony',
    kind: 'single',
    style: 'list',
    title: 'Už jste se setkal/a s konceptem tzv. „širokých“ telefonů (ať už skládací nebo klasický)?',
    options: [
      { value: 'libi', label: 'Ano, sleduji to a tento směr se mi líbí' },
      { value: 'nepresvedcilo', label: 'Ano, ale zatím mě to nepřesvědčilo' },
      { value: 'poprve', label: 'Ne, slyším o tom poprvé' },
    ],
  },
  {
    id: 'impression',
    section: 'otazky',
    short: 'První dojem',
    kind: 'single',
    style: 'list',
    title: 'Jaký je váš první dojem z širšího formátu telefonu čistě na základě fotek či osobní zkušenosti?',
    help: ONE,
    options: [
      { value: 'super', label: 'Super nápad – konečně praktičtější displej na obsah a práci' },
      { value: 'osahat', label: 'Zajímavé, ale musím si to nejdřív osahat v ruce' },
      { value: 'zbytecne', label: 'Přijde mi to zbytečně široké a nepraktické' },
    ],
  },
  {
    id: 'benefits',
    section: 'otazky',
    short: 'Největší výhoda',
    kind: 'multi',
    title: 'Co by pro vás bylo na širším displeji největší výhodou?',
    help: MORE,
    options: [
      { value: 'video', label: 'Pohodlnější sledování videí a filmů' },
      { value: 'web', label: 'Lepší čtení a prohlížení webu' },
      { value: 'socialni', label: 'Více prostoru pro sociální sítě a aplikace' },
      { value: 'psani', label: 'Pohodlnější psaní a práce s textem' },
      { value: 'hry', label: 'Lepší zážitek z hraní her' },
      { value: 'zadna', label: 'Žádnou zásadní výhodu v něm nevidím', exclusive: true },
    ],
  },
  {
    id: 'size',
    section: 'otazky',
    short: 'Ideální velikost',
    kind: 'single',
    style: 'list',
    title: 'Jaká velikost širšího telefonu by pro vás byla ideální?',
    help: ONE,
    options: [
      { value: 'kompakt', label: 'Kompaktnější verze (nižší výška, ale příjemná šířka – dobře padne do ruky i kapsy)' },
      { value: 'vlajkova', label: 'Standardní vlajková velikost (velký, široký displej na maximum obsahu)' },
      { value: 'ramecky', label: 'Záleží hlavně na tenkých rámečcích a celkové hmotnosti' },
      { value: 'zadna', label: 'Žádná, preferuji klasický telefon' },
    ],
  },
  {
    id: 'concerns',
    section: 'otazky',
    short: 'Co by vadilo',
    kind: 'multi',
    title: 'Co by vám na tomto formátu mohlo nejvíce vadit?',
    help: MORE,
    options: [
      { value: 'jednaruka', label: 'Horší ovládání jednou rukou' },
      { value: 'rozmery', label: 'Větší rozměry a horší skladnost v kapse' },
      { value: 'hmotnost', label: 'Vyšší hmotnost' },
      { value: 'aplikace', label: 'Horší přizpůsobení aplikací širšímu displeji' },
      { value: 'prinos', label: 'Nevidím v něm dostatečný přínos oproti běžnému telefonu' },
      { value: 'nic', label: 'Nic z uvedeného', exclusive: true },
    ],
  },
  {
    id: 'compromise',
    section: 'otazky',
    short: 'Nejméně přijatelný kompromis',
    kind: 'single',
    style: 'list',
    title: 'Jaký kompromis by pro vás byl u širšího telefonu nejméně přijatelný?',
    help: ONE,
    options: [
      { value: 'jednaruka', label: 'Ztráta pohodlného ovládání jednou rukou' },
      { value: 'hmotnost', label: 'Vyšší hmotnost telefonu (nad 215 g)' },
      { value: 'vybava', label: 'Horší výbava (např. slabší fotoaparáty) oproti klasickým vlajkovým lodím' },
      { value: 'cena', label: 'Vyšší cena kvůli netradičnímu formátu' },
    ],
  },
  {
    id: 'next_phone',
    section: 'otazky',
    short: 'Příští telefon široký',
    kind: 'single',
    style: 'list',
    title: 'Dokázal/a byste si představit, že by váš příští smartphone měl právě tento širší formát?',
    help: ONE,
    options: [
      { value: 'urcite', label: 'Určitě ano' },
      { value: 'spise', label: 'Spíše ano' },
      { value: 'nevim', label: 'Nevím, potřeboval/a bych si ho vyzkoušet' },
      { value: 'spise_ne', label: 'Spíše ne, preferuji klasický telefon' },
      { value: 'urcite_ne', label: 'Určitě ne' },
    ],
  },
  {
    id: 'purchase',
    section: 'otazky',
    short: 'Jak by postupoval(a)',
    kind: 'single',
    style: 'list',
    title: 'Jak byste postupoval/a, kdyby vás tento typ telefonu zaujal?',
    help: ONE,
    options: [
      { value: 'online', label: 'Klidně ho koupím online na základě recenzí a fotek' },
      { value: 'osahat', label: 'Určitě si ho musím nejdřív osahat naživo, jak sedí v ruce a v kapse' },
      { value: 'pockam', label: 'Počkám na reakce prvních uživatelů, jestli se tento formát uchytí' },
      { value: 'nezaujal', label: 'Tento formát mě nezaujal' },
    ],
  },
  {
    id: 'phone_priorities',
    section: 'otazky',
    short: 'Priority při výběru telefonu',
    kind: 'multi',
    ranked: true,
    title: 'Co je pro vás důležité při výběru telefonu?',
    help: 'Označte od nejdůležitějšího po nejméně. První kliknutí = 1. místo. Opětovným kliknutím volbu odeberete a můžete pořadí změnit.',
    options: [
      { value: 'ergonomie_design', label: 'Ergonomie & design' },
      { value: 'fotoaparaty', label: 'Špičkové fotoaparáty' },
      { value: 'baterie', label: 'Velká baterie' },
      { value: 'cena', label: 'Cena' },
    ],
  },
];

// Historical wording stays available only in the admin table and CSV.
const ANKETA_ARCHIVED_QUESTIONS: Question[] = [
  {
    id: 'convince_ranked',
    section: 'otazky',
    short: 'Dříve: co by přesvědčilo',
    kind: 'multi',
    ranked: true,
    previousId: 'convince',
    title: 'Co by vás nejvíce přesvědčilo dát širšímu formátu šanci při koupi příštího mobilu?',
    help: 'Klikáním seřaďte všechny možnosti od nejdůležitější po nejméně důležitou. První kliknutí = 1. místo. Opětovným kliknutím volbu odeberete a můžete pořadí změnit. Pokud vás nic nepřesvědčí, vyberte pouze poslední možnost.',
    options: [
      { value: 'vyzkouseni', label: 'Možnost si ho předem vyzkoušet naživo v prodejně' },
      { value: 'ergonomie', label: 'Skvělá ergonomie (tenké tělo, nízká hmotnost a dobře tvarované hrany)' },
      { value: 'foto_baterie', label: 'Špičkové fotoaparáty a velká baterie, kterou širší tělo umožní' },
      { value: 'cena', label: 'Cena srovnatelná s klasickými modely stejné třídy' },
      { value: 'nic', label: 'Nic, zůstanu u klasického úzkého tvaru', exclusive: true },
    ],
  },
];

export const ANKETA: SurveyDef = {
  slug: 'wide-2026-anketa',
  title: ANKETA_TEXT.title,
  path: '/dotaznik/anketa',
  name: 'Testovací anketa',
  questions: ANKETA_QUESTIONS,
  archivedQuestions: ANKETA_ARCHIVED_QUESTIONS,
  sections: { uvod: 'Úvod', otazky: 'Otázky' },
  open: [],
  meeting: false,
  newsletter: true,
  filters: ['known', 'next_phone'],
};
