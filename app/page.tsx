import Link from 'next/link';
import { CONTEST, instagramProfileUrl } from '@/lib/config';
import { getPhase, isVotingOpen, longDate, nextMilestone, plural } from '@/lib/contest';
import { getEntries, getStats, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import { img } from '@/lib/images';
import EntryCard from '@/components/EntryCard';
import Milestones from '@/components/Milestones';
import PrizeTable from '@/components/PrizeTable';
import Themes from '@/components/Themes';
import CopyChip from '@/components/CopyChip';
import { BrandLogo } from '@/components/Logo';
import Mosaic from '@/components/Mosaic';

export const dynamic = 'force-dynamic';

const phaseText = {
  before: `Startujeme ${longDate(CONTEST.start)}`,
  entries: `Soutěž běží do ${longDate(CONTEST.entriesEnd)}`,
  voting: `Hlasování běží do ${longDate(CONTEST.votingEnd)}`,
  ended: `Vítěze vyhlásíme ${longDate(CONTEST.winnersDate)}`,
};

export default async function HomePage() {
  const [stats, latest, user] = await Promise.all([getStats(), getEntries({ sort: 'new', limit: 6 }), getUser()]);
  const voted = await getVotedEntryIds(user?.id);
  const phase = getPhase();
  const votingOpen = isVotingOpen();
  const handle = CONTEST.instagramHandle;
  const hero = img('hero.jpg');
  const community = img('community.jpg');
  const xpan = img('xpan.jpg');
  const next = nextMilestone(stats.entrants);

  return (
    <>
      <section className="hero">
        {hero ? <img className="hero-img" src={hero} alt="" fetchPriority="high" /> : <div className="hero-fallback" />}
        <div className="hero-shade" />
        <div className="container hero-content">
          <span className="label" style={{ color: '#e6e6e6' }}>OPPO Photo Contest · {CONTEST.dateRangeLabel}</span>
          <h1>Lovci světla</h1>
          <p className="lead">
            Zimní světlo očima české komunity. Vyfoť ho, dej na Instagram a nech ostatní, ať rozhodnou. Hraje se o OPPO Find X10.
          </p>
          <div className="hero-actions">
            <a href="#jak" className="btn btn-white">Jak se zapojit</a>
            <Link href="/galerie" className="btn btn-outline">Hlasovat</Link>
          </div>
        </div>
        {hero && <span className="hero-credit">Vyfoceno na OPPO Find X10 Pro Max · Hasselblad</span>}
      </section>

      <div className="strip">
        <div className="container strip-inner">
          <div className="strip-item">
            <span className="label live">{phaseText[phase]}</span>
          </div>
          <div className="strip-item">
            <span className="strip-num">{stats.entrants}</span>
            <span className="small muted">{plural(stats.entrants, 'soutěžící', 'soutěžící', 'soutěžících')}</span>
          </div>
          <div className="strip-item">
            <span className="strip-num">{stats.votes}</span>
            <span className="small muted">{plural(stats.votes, 'hlas', 'hlasy', 'hlasů')}</span>
          </div>
          <div className="strip-item">
            <span className="strip-num accent">{next ? next.at - stats.entrants : 0}</span>
            <span className="small muted">{next ? `chybí do ${next.prize.replace('OPPO ', '')}` : 'vše odemčeno'}</span>
          </div>
        </div>
      </div>

      <section className="section">
        <div className="container statement">
          <h2>Porota tu není. O vítězích rozhodne komunita.</h2>
          <div>
            <p className="lead">
              Každý s ověřeným e-mailem může hlasovat a každý nový soutěžící odemyká lepší ceny pro všechny. Fotit můžeš na jakýkoli
              telefon. Nejde o techniku, jde o světlo.
            </p>
          </div>
        </div>
      </section>

      <section className="section paper" id="jak">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Stačí jeden příspěvek</h2>
            <p className="lead">Žádné formuláře ani registrace. Fotku si najdeme sami a do 24 hodin ji přidáme do galerie.</p>
          </div>
          <ol className="steps" style={{ listStyle: 'none', padding: 0 }}>
            <li className="step">
              <span className="step-num">01</span>
              <h3>Vyfoť zimní světlo</h3>
              <p>Jedno ze čtyř témat níže. Zlatá hodina, modrá hodina, mlha nebo detail z dálky.</p>
            </li>
            <li className="step">
              <span className="step-num">02</span>
              <h3>Dej ji na Instagram</h3>
              <p>Do popisku přidej hashtag a označ nás. Fotíš na OPPO nebo OnePlus? Přidej i #ShotOnOPPO a hraješ o cenu navíc.</p>
              <div className="chips">
                <CopyChip text={CONTEST.hashtag} />
                <CopyChip text={`@${handle}`} />
                <CopyChip text={CONTEST.oppoHashtag} />
              </div>
            </li>
            <li className="step">
              <span className="step-num">03</span>
              <h3>Sbírej hlasy</h3>
              <p>Každá fotka má vlastní stránku s odkazem ke sdílení. Pošli ho kamarádům a dej do stories.</p>
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
            <p className="lead">Soutěží se jen s fotkami na tato témata. Ukázky jsou z telefonů OPPO, ať víš, kam mířit.</p>
          </div>
          <Themes />
        </div>
      </section>

      {xpan && (
        <div className="pano">
          <img src={xpan} alt="Panoramatický snímek horské louky v ranním světle, vyfoceno na OPPO Find X10" loading="lazy" />
          <span className="pano-caption">Režim XPAN · OPPO Find X10</span>
        </div>
      )}

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Takhle vidí svět Find X10</h2>
            <p className="lead">
              Všechny fotky na téhle stránce jsou z OPPO Find X10 a Find X10 Pro Max s fotoaparátem Hasselblad. Žádný velký
              foťák, jen telefon v kapse.
            </p>
          </div>
          <Mosaic />
        </div>
      </section>

      <section className="section dark">
        <div className="container">
          <div className="section-head">
            <h2 className="h2">Čím víc nás bude, tím víc vyhrajeme</h2>
            <p className="lead">Ceny neodemyká OPPO, odemyká je komunita. Počet soutěžících rozhodne, o co se hraje.</p>
          </div>
          <Milestones entrants={stats.entrants} />
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
              <span className="label label-accent">Shot on OPPO</span>
              <h3>Poukaz 2 000 Kč do e-shopu OPPO</h3>
              <p>Pro nejvíc hlasovanou fotku s {CONTEST.oppoHashtag}. Na příslušenství, sluchátka nebo hodinky.</p>
              <div className="brand-row">
                <span className="small muted">Pro majitele</span>
                <BrandLogo brand="oppo" variant="dark" height={14} />
                <BrandLogo brand="oneplus" variant="dark" height={14} />
              </div>
            </div>
            <div>
              <span className="label label-accent">Výherce Find X10</span>
              <h3>Community Reviewer</h3>
              <p>Do dvou týdnů od převzetí natočí video se zkušenostmi a nasdílí první fotky z telefonu. Komunita uvidí, jak fotí doopravdy.</p>
            </div>
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="section paper">
          <div className="container">
            <div className="toolbar">
              <h2 className="h2" style={{ maxWidth: 'none' }}>Nejnovější fotky</h2>
              <Link href="/galerie" className="btn btn-black btn-small">Celá galerie</Link>
            </div>
            <div className="gallery">
              {latest.map((e) => (
                <EntryCard key={e.id} entry={e} voted={voted.has(e.id)} loggedIn={Boolean(user)} votingOpen={votingOpen} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section community">
        {community && <img className="community-img" src={community} alt="" loading="lazy" />}
        <div className="community-shade" />
        <div className="container">
          <span className="label" style={{ color: '#cfcfcf' }}>Komunita</span>
          <h2 className="h2" style={{ marginTop: 12 }}>Nehlasujeme za vás. Hlasujete vy.</h2>
          <div className="community-grid">
            <div className="community-item">
              <h3>Vy rozhodujete</h3>
              <p>Žádná porota. Vyhrají fotky, které komunita vybere hlasováním.</p>
            </div>
            <div className="community-item">
              <h3>Odemykáte společně</h3>
              <p>Každý nový soutěžící posune všechny blíž k Find X10. Pozvi lidi, co fotí.</p>
            </div>
            <div className="community-item">
              <h3>Fotka týdne</h3>
              <p>Každou neděli zveřejníme nejsilnější fotku týdne na našem Instagramu, s označením autora.</p>
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
            <div className="timeline-item"><div className="date">{longDate(CONTEST.start)}</div><p>Start soutěže a hlasování</p></div>
            <div className="timeline-item"><div className="date">{longDate(CONTEST.entriesEnd)}</div><p>Poslední den pro nové fotky</p></div>
            <div className="timeline-item"><div className="date">{longDate(CONTEST.votingEnd)}</div><p>Konec hlasování</p></div>
            <div className="timeline-item"><div className="date">{longDate(CONTEST.winnersDate)}</div><p>Vyhlášení vítězů na Instagramu</p></div>
          </div>
        </div>
      </section>
    </>
  );
}
