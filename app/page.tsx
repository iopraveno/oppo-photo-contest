import type { Metadata } from 'next';
import Link from 'next/link';
import { CONTEST, instagramProfileUrl } from '@/lib/config';
import { clockTime, getPhase, longDate } from '@/lib/contest';
import { getEntries, getStats, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { img } from '@/lib/images';
import EntryCard from '@/components/EntryCard';
import Milestones from '@/components/Milestones';
import PrizeTable from '@/components/PrizeTable';
import Themes from '@/components/Themes';
import CopyChip from '@/components/CopyChip';
import Mosaic from '@/components/Mosaic';
import LightToday from '@/components/LightToday';
import { faqItems, homeJsonLd, pageMeta } from '@/lib/seo';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = pageMeta({ path: '/' });

const phaseText = {
  before: `Startujeme ${longDate(CONTEST.start)} v ${clockTime(CONTEST.start)}`,
  entries: `Soutěž běží do ${longDate(CONTEST.entriesEnd)}`,
  voting: `Hlasování běží do ${longDate(CONTEST.votingEnd)}`,
  ended: `Vítěze vyhlásíme ${longDate(CONTEST.winnersDate)}`,
};

export default async function HomePage() {
  const [stats, top, user] = await Promise.all([getStats(), getEntries({ sort: 'top', limit: 6 }), getUser()]);
  const voted = await getVotedEntryIds(user?.id);
  const phase = getPhase();
  const handle = CONTEST.instagramHandle;
  const hero = img('hero.jpg');
  const heroSmall = img('hero-1280.jpg');
  const community = img('community.jpg');
  const xpan = img('xpan.jpg');

  const faq = faqItems();
  const now = Date.now();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd()).replace(/</g, '\\u003c') }} />
      <section className="hero">
        {hero ? (
          <img
            className="hero-img"
            src={hero}
            srcSet={heroSmall ? `${heroSmall} 1280w, ${hero} 2880w` : undefined}
            sizes="100vw"
            alt=""
            fetchPriority="high"
          />
        ) : (
          <div className="hero-fallback" />
        )}
        <div className="hero-shade" />
        <div className="container hero-content">
          <h1>Lovci světla</h1>
          <p className="lead">
            Zimní světlo očima české komunity. Vyfoť ho, dej na Instagram a nech ostatní, ať rozhodnou. Hraje se o OPPO Find X10.
          </p>
          <div className="hero-actions">
            <a href="#jak" className="btn btn-white">Jak se zapojit</a>
            {phase === 'ended' ? (
              <Link href="/zebricek" className="btn btn-outline">Výsledky</Link>
            ) : user ? (
              <Link href="/galerie" className="btn btn-outline">Hlasovat</Link>
            ) : (
              <Link href="/prihlaseni?next=/galerie" className="btn btn-outline">Přihlásit se a hlasovat</Link>
            )}
          </div>
          <p className="hero-meta">{phaseText[phase]}</p>
        </div>
        {hero && <span className="hero-credit">Vyfoceno na OPPO Find X10 Series</span>}
      </section>

      <LightToday initialNow={now} />

      {top.length > 0 && (
        <section className="section" id="oblibene">
          <div className="container">
            <div className="section-head">
              <h2 className="h2">Nejoblíbenější fotky</h2>
              <p className="lead">Každé fotce můžeš dát jeden hlas a podpořit kolik fotek chceš.</p>
            </div>
            <div className="gallery">
              {top.map((e) => (
                <EntryCard key={e.id} entry={e} voted={voted.has(e.id)} loggedIn={Boolean(user)} phase={phase} returnTo="/#oblibene" />
              ))}
            </div>
            <div className="gallery-more">
              <Link href="/galerie" className="btn btn-black">Zobrazit celou galerii</Link>
              <Link href="/zebricek" className="btn btn-outline">Žebříček</Link>
            </div>
          </div>
        </section>
      )}

      <section className="section paper" id="jak">
        <div className="container howto">
          <div className="howto-intro">
            <h2 className="h2">Stačí jeden příspěvek</h2>
            <p className="lead" style={{ marginTop: 16 }}>Žádné formuláře ani registrace. Fotku si najdeme sami a do 24 hodin ji přidáme do galerie.</p>
          </div>
          <ol className="howto-steps">
            <li className="howto-step">
              <span className="howto-num">1</span>
              <div>
                <h3>Vyfoť zimní světlo</h3>
                <p>Jedno ze čtyř témat: zlatá hodina, modrá hodina, mlha nebo detail z dálky. Na jakýkoli mobil.</p>
              </div>
            </li>
            <li className="howto-step">
              <span className="howto-num">2</span>
              <div>
                <h3>Dej ji na Instagram</h3>
                <p>Do popisku přidej hashtag a označ nás. Fotíš na OPPO nebo OnePlus? Přidej i #ShotOnOPPO a hraješ o cenu navíc.</p>
                <div className="chips">
                  <CopyChip text={`${CONTEST.hashtag} @${handle}`} label="Zkopírovat popisek" />
                  <CopyChip text={CONTEST.oppoHashtag} />
                </div>
              </div>
            </li>
            <li className="howto-step">
              <span className="howto-num">3</span>
              <div>
                <h3>Sbírej hlasy</h3>
                <p>Každá fotka má vlastní stránku s odkazem ke sdílení. Pošli ho kamarádům a dej do stories.</p>
              </div>
            </li>
          </ol>
          <p className="fineprint">
            Účet musí být veřejný a sledovat{' '}
            <a href={instagramProfileUrl(handle)} target="_blank" rel="noopener noreferrer">@{handle}</a>. Jeden příspěvek = jedna fotka,
            nejvýš jedna týdně a celkem {CONTEST.maxEntriesPerPerson}. Fotka musí být z mobilu a tvoje. <Link href="/pravidla">Celá pravidla</Link>
          </p>
        </div>
      </section>

      <section className="section" id="temata">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Čtyři témata, jedno světlo</h2>
            <p className="lead">Soutěží se jen s fotkami na tato témata. Ukázky jsou z OPPO Find X10 Series, ať víš, kam mířit.</p>
          </div>
          <Themes now={now} />
        </div>
      </section>

      {xpan && (
        <div className="pano">
          <img src={xpan} alt="Panoramatický snímek horské louky v ranním světle, vyfoceno na OPPO Find X10 Series" loading="lazy" />
          <span className="pano-caption">Režim XPAN | OPPO Find X10 Series</span>
        </div>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head section-head-stack">
            <h2 className="h2 h2-wide">Takhle vidí svět Find X10 Series</h2>
            <p className="lead">
              Všechny fotky na téhle stránce jsou z OPPO Find X10 a Find X10 Pro Max s fotoaparátem Hasselblad. Žádný velký
              foťák, jen telefon v kapse.
            </p>
          </div>
          <Mosaic />
        </div>
      </section>

      <section className="section dark" id="milniky">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Čím víc nás bude, tím víc vyhrajeme</h2>
            <p className="lead">Ceny neodemyká OPPO, odemyká je komunita. Počet soutěžících rozhodne, o co se hraje.</p>
          </div>
          <Milestones stats={stats} />
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Kdo co vyhraje</h2>
            <p className="lead">Ceny dostanou fotky s nejvíc hlasy ke dni {longDate(CONTEST.votingEnd)}. Každý může vyhrát jen jednu.</p>
          </div>
          <PrizeTable entrants={stats.entrants} />
          <div className="prize-extra">
            <div>
              <h3>Poukaz 2 000 Kč do e-shopu OPPO</h3>
              <p>Pro nejvíc hlasovanou fotku s {CONTEST.oppoHashtag}. Pro majitele telefonů OPPO a OnePlus, na příslušenství, sluchátka nebo hodinky.</p>
            </div>
            <div>
              <h3>Výherce Find X10 natočí recenzi</h3>
              <p>Do dvou týdnů od převzetí natočí video se zkušenostmi a nasdílí první fotky z telefonu. Komunita uvidí, jak fotí doopravdy.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section community">
        {community && <img className="community-img" src={community} alt="" loading="lazy" />}
        <div className="community-shade" />
        <div className="container community-inner">
          <h2 className="h2">Porota tu není. Hlasujete vy.</h2>
          <div className="community-grid">
            <div className="community-item">
              <h3>Fotka týdne</h3>
              <p>Každou neděli dáme nejsilnější fotku týdne na náš Instagram, s označením autora.</p>
            </div>
            <div className="community-item">
              <h3>OPPO Photo Club</h3>
              <p>Nejlepší autory pozveme na setkání a k prvním ukázkám nových telefonů.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Kdy se co děje</h2>
          </div>
          <div className="timeline">
            <div className="timeline-item"><div className="date">{longDate(CONTEST.start)}</div><p>Start soutěže a hlasování v {clockTime(CONTEST.start)}</p></div>
            <div className="timeline-item"><div className="date">{longDate(CONTEST.entriesEnd)}</div><p>Poslední den pro nové fotky</p></div>
            <div className="timeline-item"><div className="date">{longDate(CONTEST.votingEnd)}</div><p>Konec hlasování</p></div>
            <div className="timeline-item"><div className="date">{longDate(CONTEST.winnersDate)}</div><p>Vyhlášení vítězů na Instagramu</p></div>
          </div>
        </div>
      </section>

      <section className="section paper" id="faq">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Časté dotazy</h2>
            <p className="lead">
              Podrobnosti najdeš v <Link href="/pravidla">pravidlech soutěže</Link>.
            </p>
          </div>
          <div className="faq">
            {faq.map((f) => (
              <details key={f.q} className="faq-item">
                <summary>{f.q}</summary>
                <p>{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
