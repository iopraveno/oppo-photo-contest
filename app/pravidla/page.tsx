import type { Metadata } from 'next';
import { pageMeta } from '@/lib/seo';
import Link from 'next/link';
import { CONTEST, ORGANIZER } from '@/lib/config';
import { clockTime, longDate } from '@/lib/contest';

export const metadata: Metadata = pageMeta({
  title: 'Pravidla soutěže',
  description: 'Pravidla fotosoutěže OPPO Lovci světla: termíny, témata, jak se zapojit, hlasování, výhry, licence k fotkám a osobní údaje.',
  path: '/pravidla',
});


export default function RulesPage() {
  const h = CONTEST.instagramHandle;
  return (
    <section className="section">
      <div className="container prose">
        <p className="eyebrow">Pravidla</p>
        <h1 className="section-title">Pravidla soutěže {CONTEST.fullName}</h1>

        <h2>1. Pořadatel</h2>
        <p>
          Pořadatelem soutěže je {ORGANIZER.name}, IČO {ORGANIZER.ico}, se sídlem {ORGANIZER.address}, {ORGANIZER.register} (dále
          jen „pořadatel“). Dotazy k soutěži posílej na <a href={`mailto:${ORGANIZER.email}`}>{ORGANIZER.email}</a>.
        </p>

        <h2>2. Termín</h2>
        <p>
          Soutěžní fotky je možné zveřejňovat od {longDate(CONTEST.start)} 2026 od {clockTime(CONTEST.start)} do {longDate(CONTEST.entriesEnd)} 2026 do 23:59.
          Hlasování probíhá do {longDate(CONTEST.votingEnd)} 2026 do 23:59. Vítězové budou vyhlášeni{' '}
          {longDate(CONTEST.winnersDate)} 2026 na Instagramu @{h}.
        </p>

        <h2>3. Kdo se může zúčastnit</h2>
        <p>
          Fyzické osoby starší 18 let s bydlištěm v České republice, které mají veřejný účet na Instagramu. Soutěže se nemohou
          účastnit zaměstnanci pořadatele a osoby jim blízké.
        </p>

        <h2>4. Jak se zapojit</h2>
        <ul>
          <li>
            Zveřejni na svém veřejném Instagramu fotku na jedno ze soutěžních témat ({CONTEST.themes.map((t) => t.title.toLowerCase()).join('; ')})
            s hashtagem {CONTEST.hashtag} a označ účet @{h}.
          </li>
          <li>Musíš sledovat účet @{h}.</li>
          <li>Jeden příspěvek obsahuje jednu fotku (ne album ani story). Soutěžit můžeš nejvýš s jednou fotkou týdně, celkem s {CONTEST.maxEntriesPerPerson}.</li>
          <li>Fotka musí být pořízená mobilním telefonem a musí být tvoje. Běžné úpravy (expozice, barvy, ořez) jsou v pořádku, fotky vytvořené nebo upravené generativní AI ne.</li>
          <li>Fotíš na OPPO nebo OnePlus? Přidej i hashtag {CONTEST.oppoHashtag} a soutěžíš i o zvláštní cenu.</li>
          <li>Zveřejněním fotky s hashtagem {CONTEST.hashtag} souhlasíš s těmito pravidly.</li>
          <li>Pořadatel fotky přidává do galerie na tomto webu. Fotky mimo téma, nevhodné nebo porušující pravidla do galerie nezařadí.</li>
        </ul>

        <h2>5. Hlasování</h2>
        <p>
          Hlasovat může každý, kdo se na webu přihlásí ověřeným e-mailem. Každé fotce lze dát jeden hlas, hlasovat je možné pro
          libovolný počet fotek. Pořadatel může zrušit hlasy, které vznikly podvodně (například hromadně zakládanými e-maily nebo
          automaticky), a soutěžícího, který se na podvodu podílí, vyloučit.
        </p>

        <h2>6. Výhry a milníky</h2>
        <p>Výhry získají fotky s nejvyšším počtem platných hlasů. Počet výher závisí na počtu soutěžících, tedy instagramových účtů s alespoň jednou schválenou fotkou, ke dni {longDate(CONTEST.entriesEnd)}:</p>
        <ul>
          <li>méně než 50 soutěžících: 1. místo OPPO Enco Air5 Pro,</li>
          <li>50 až 149 soutěžících: 1. místo OPPO Watch S, 2. místo OPPO Enco Air5 Pro,</li>
          <li>150 a více soutěžících: 1. místo OPPO Find X10, 2. místo OPPO Watch S, 3. místo OPPO Enco Air5 Pro.</li>
        </ul>
        <p>
          Zvláštní cenu, {CONTEST.oppoPrize.toLowerCase()}, získá fotka označená {CONTEST.oppoHashtag} s nejvyšším počtem platných
          hlasů. Jeden soutěžící může získat nejvýš jednu výhru, další výhra pak připadne dalšímu v pořadí.
        </p>

        <h2>7. Výherce OPPO Find X10</h2>
        <p>
          Výherce OPPO Find X10 se zavazuje do 14 dnů od převzetí telefonu zveřejnit na svém Instagramu video se zkušenostmi s
          telefonem a fotky z něj, s označením @{h} a jako placenou spolupráci. Podrobnosti upraví krátká dohoda, kterou výherce
          podepíše při předání výhry.
        </p>

        <h2>8. Předání výher</h2>
        <p>
          Výherce kontaktujeme přes zprávu na Instagramu z účtu @{h}. Pokud výherce do 7 dnů neodpoví, výhra připadne dalšímu
          v pořadí. Výhry pošleme na adresu v České republice. Případnou daň z výhry řeší pořadatel podle zákona o daních z příjmů.
        </p>

        <h2>9. Fotografie a licence</h2>
        <p>
          Soutěžící prohlašuje, že je autorem fotky a že má souhlas osob, které jsou na ní zachycené. Zveřejněním fotky v soutěži
          uděluje pořadateli bezúplatnou nevýhradní licenci fotku užít, sdílet a upravit pro propagaci soutěže a značek OPPO a
          OnePlus, vždy s uvedením autora, a to po dobu 2 let od skončení soutěže. Příspěvky a materiály zveřejněné během této doby
          není pořadatel povinen po jejím uplynutí odstraňovat.
        </p>

        <h2>10. Osobní údaje</h2>
        <p>
          Pořadatel zpracovává e-mailové adresy hlasujících a instagramová jména soutěžících jen pro účely soutěže a po předání
          výher je smaže. Podrobnosti najdeš v <Link href="/ochrana-osobnich-udaju">zásadách zpracování osobních údajů</Link>.
        </p>

        <h2>11. Instagram</h2>
        <p>
          Tato soutěž není nijak sponzorována, podporována ani spravována společností Instagram (Meta Platforms) ani s ní není
          nijak spojena. Účastí v soutěži soutěžící zprošťuje společnost Instagram jakékoli odpovědnosti související se soutěží.
        </p>

        <h2>12. Závěrečná ustanovení</h2>
        <p>
          Pořadatel si vyhrazuje právo pravidla změnit nebo soutěž zrušit. Změny zveřejní na této stránce. Na výhry není právní
          nárok a nelze je vyměnit za peníze.
        </p>
      </div>
    </section>
  );
}
