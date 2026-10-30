import Link from 'next/link';
import { CONTEST, instagramProfileUrl } from '@/lib/config';
import { getPhase, isVotingOpen, longDate } from '@/lib/contest';
import { getEntries, getStats, getVotedEntryIds } from '@/lib/data';
import { getUser } from '@/lib/auth';
import EntryCard from '@/components/EntryCard';
import Milestones from '@/components/Milestones';
import PrizeTable from '@/components/PrizeTable';

export const dynamic = 'force-dynamic';

const phaseText = {
  before: `Startujeme ${longDate(CONTEST.start)}`,
  entries: `Soutěž běží, fotky přijímáme do ${longDate(CONTEST.entriesEnd)}`,
  voting: `Přihlášky jsou uzavřené, hlasovat můžeš do ${longDate(CONTEST.votingEnd)}`,
  ended: `Soutěž skončila, vítěze vyhlásíme ${longDate(CONTEST.winnersDate)}`,
};

export default async function HomePage() {
  const [stats, latest, user] = await Promise.all([getStats(), getEntries({ sort: 'new', limit: 6 }), getUser()]);
  const voted = await getVotedEntryIds(user?.id);
  const phase = getPhase();
  const votingOpen = isVotingOpen();
  const handle = CONTEST.instagramHandle;

  return (
    <>
      <section className="hero">
        <div className="wrap">
          <p className="eyebrow" style={{ color: 'var(--amber)' }}>
            OPPO Photo Contest · {CONTEST.dateRangeLabel}
          </p>
          <h1>{CONTEST.name}</h1>
          <p className="hero-lead">
            Vyfoť zimní světlo, sdílej ho na Instagramu a nech komunitu rozhodnout. Porota tu není, vítěze vyberete vy.
          </p>
          <div className="hero-actions">
            <a href="#jak" className="btn btn-primary">Jak se zapojit</a>
            <Link href="/galerie" className="btn btn-ghost">Hlasovat v galerii</Link>
          </div>
          <div className="hero-status">
            <span className="dot" aria-hidden /> {phaseText[phase]}
          </div>
        </div>
      </section>

      <section className="section" id="jak">
        <div className="wrap">
          <p className="eyebrow">Jak se zapojit</p>
          <h2 className="section-title">Stačí jeden příspěvek na Instagramu</h2>
          <p className="section-lead">Žádné formuláře ani registrace. O zbytek se postaráme my.</p>
          <div className="grid-3">
            <div className="card">
              <div className="step-num">1</div>
              <h3>Vyfoť zimní světlo</h3>
              <p>Zlatá hodina, západ slunce, modrá hodina, mlha nebo světla města. Fotit můžeš jakýmkoli mobilem.</p>
            </div>
            <div className="card">
              <div className="step-num">2</div>
              <h3>Dej ji na Instagram</h3>
              <p>
                Přidej <span className="tag">{CONTEST.hashtag}</span> a označ{' '}
                <a className="tag" href={instagramProfileUrl(handle)} target="_blank" rel="noopener noreferrer">@{handle}</a>.
                Fotíš na OPPO nebo OnePlus? Přidej i <span className="tag">{CONTEST.oppoHashtag}</span>.
              </p>
            </div>
            <div className="card">
              <div className="step-num">3</div>
              <h3>Sbírej hlasy</h3>
              <p>Fotku přidáme do galerie, obvykle do 24 hodin. Pak pošli odkaz kamarádům, ať ti dají hlas.</p>
            </div>
          </div>
          <p className="note">
            Účet musí být veřejný a sledovat @{handle}. Jeden příspěvek = jedna fotka, nejvýš jedna fotka týdně a celkem{' '}
            {CONTEST.maxEntriesPerPerson}. <Link href="/pravidla">Celá pravidla</Link>
          </p>
        </div>
      </section>

      <section className="section section-dark">
        <div className="wrap">
          <p className="eyebrow">Odemkněte výhry společně</p>
          <h2 className="section-title">Čím víc nás bude, tím víc vyhrajeme</h2>
          <p className="section-lead">
            Každý nový soutěžící přidává do hry další cenu. Při {CONTEST.milestones[2].at} soutěžících se odemkne {CONTEST.milestones[2].prize}.
          </p>
          <Milestones entrants={stats.entrants} />
        </div>
      </section>

      <section className="section">
        <div className="wrap">
          <p className="eyebrow">Ceny</p>
          <h2 className="section-title">Kdo co vyhraje</h2>
          <p className="section-lead">Ceny dostanou fotky s nejvíc hlasy. Každý může vyhrát jen jednu cenu.</p>
          <PrizeTable entrants={stats.entrants} />
          <div className="grid-3">
            <div className="card">
              <p className="eyebrow">Shot on OPPO</p>
              <h3>Poukaz 2 000 Kč</h3>
              <p>Pro nejvíc hlasovanou fotku s {CONTEST.oppoHashtag}, na příslušenství v e-shopu OPPO.</p>
            </div>
            <div className="card">
              <p className="eyebrow">Výherce Find X10</p>
              <h3>Community Reviewer</h3>
              <p>Do 2 týdnů od převzetí natočí video se zkušenostmi s telefonem a nasdílí fotky z něj.</p>
            </div>
            <div className="card">
              <p className="eyebrow">Každou neděli</p>
              <h3>Fotka týdne</h3>
              <p>Nejlepší fotku týdne zveřejníme na našem Instagramu s označením autora.</p>
            </div>
          </div>
        </div>
      </section>

      {latest.length > 0 && (
        <section className="section" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="toolbar">
              <h2 className="section-title" style={{ margin: 0 }}>Nejnovější fotky</h2>
              <Link href="/galerie" className="btn btn-dark btn-small">Celá galerie</Link>
            </div>
            <div className="gallery">
              {latest.map((e) => (
                <EntryCard key={e.id} entry={e} voted={voted.has(e.id)} loggedIn={Boolean(user)} votingOpen={votingOpen} />
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="section section-dark">
        <div className="wrap">
          <p className="eyebrow">Termíny</p>
          <h2 className="section-title">Kdy se co děje</h2>
          <div className="grid-3" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
            <div className="card">
              <h3>{longDate(CONTEST.start)}</h3>
              <p>Start soutěže a hlasování</p>
            </div>
            <div className="card">
              <h3>{longDate(CONTEST.entriesEnd)}</h3>
              <p>Poslední den pro nové fotky</p>
            </div>
            <div className="card">
              <h3>{longDate(CONTEST.votingEnd)}</h3>
              <p>Konec hlasování</p>
            </div>
            <div className="card">
              <h3>{longDate(CONTEST.winnersDate)}</h3>
              <p>Vyhlášení vítězů na Instagramu</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
