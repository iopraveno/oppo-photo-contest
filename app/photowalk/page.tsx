import type { Metadata } from 'next';
import { ORGANIZER, PHOTOWALK, TURNSTILE_SITE_KEY } from '@/lib/config';
import { eventDayLabel, eventTimeLabel, getSeatCounts, googleCalendarUrl, isSignupOpen, signupEndLabel } from '@/lib/photowalk';
import { img } from '@/lib/images';
import Seats from '@/components/Seats';
import SignupForm from './SignupForm';

export const dynamic = 'force-dynamic';

// Hidden page: reachable from the invitation e-mail only, not linked from the site and kept out of search.
export const metadata: Metadata = {
  title: 'Photo walk s Martinem Rakem',
  description: 'Sobotní odpoledne na Vyšehradě s fotografem Martinem Rakem. 14 míst, přihlášení předem.',
  robots: { index: false, follow: false, nocache: true },
};

const prague = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat('cs-CZ', { timeZone: 'Europe/Prague', ...o });

export default async function PhotoWalkPage() {
  const counts = await getSeatCounts();
  const open = isSignupOpen();
  const free = Math.max(PHOTOWALK.capacity - counts.confirmed, 0);
  const full = free === 0;
  const start = new Date(PHOTOWALK.start);
  const hero = img('photowalk/hero.jpg');
  const map = img('photowalk/mapa.jpg');
  const portrait = img('photowalk/martin-rak.jpg');
  const deadline = signupEndLabel();

  return (
    <>
      <section className="pw-hero">
        {hero ? <img className="pw-hero-img" src={hero} alt="" fetchPriority="high" /> : <div className="hero-fallback" />}
        <div className="pw-hero-shade" />
        <div className="container pw-hero-inner">
          <div className="pw-hero-text">
            <p className="pw-free"><strong>Účast zdarma</strong> + voucher 500 Kč</p>
            <h1>Fotíme Vyšehrad<br /> s&nbsp;Martinem Rakem</h1>
            <p className="lead">
              Sobotní odpoledne v terénu s krajinářem oceněným v EISA Maestro i Sony World Photography Awards. Bez stativu a batohu
              plného objektivů, jen s telefonem v ruce.
            </p>
            <div className="hero-actions">
              <a href="#prihlaska" className="btn btn-white">{open ? 'Chci jít s Martinem' : 'Detaily akce'}</a>
              <a href="#program" className="btn btn-outline">Program a trasa</a>
            </div>
          </div>

          <div className="pw-cal" aria-label={`${eventDayLabel()}, ${eventTimeLabel()}`}>
            <div className="pw-cal-month">{prague({ month: 'long' }).format(start)}</div>
            <div className="pw-cal-body">
              <div className="pw-cal-day">{prague({ day: 'numeric' }).format(start).replace(/\.$/, '')}</div>
              <div className="pw-cal-week">{prague({ weekday: 'long' }).format(start)}</div>
              <div className="pw-cal-time">{eventTimeLabel()}</div>
              <div className="pw-cal-place">{PHOTOWALK.place}, {PHOTOWALK.address}</div>
            </div>
            <div className="pw-cal-links">
              <a href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">Google Kalendář</a>
              <a href="/photowalk/kalendar.ics">Apple a Outlook</a>
            </div>
          </div>
        </div>
        <p className="hero-credit">Foto: Martin Rak</p>
      </section>

      <section className="dark pw-signup-band" id="prihlaska">
        <div className="container pw-signup">
          <div className="pw-seats-col">
            <Seats filled={counts.confirmed} total={PHOTOWALK.capacity} size="lg" />
            <h2 className="pw-seats-title">
              {full ? `Všech ${PHOTOWALK.capacity} míst je obsazených` : `${free} ${free === 1 ? 'volné místo' : free <= 4 ? 'volná místa' : 'volných míst'} z ${PHOTOWALK.capacity}`}
            </h2>
            <p className="pw-seats-text">
              Skupinu držíme malou, aby měl Martin čas na každého. Každý čtvereček je jedno místo a zaplní se, jakmile přihlášku
              potvrdíme. {full ? 'Pořád se ale můžete zapsat mezi náhradníky.' : `Přihlaste se do ${deadline}, nebo dokud nebude plno.`}
            </p>
            <dl className="pw-facts">
              <div><dt>Kdy</dt><dd>{eventDayLabel()}, {eventTimeLabel()}</dd></div>
              <div><dt>Sraz</dt><dd>{PHOTOWALK.place}, {PHOTOWALK.address}, <a href={PHOTOWALK.mapsUrl} target="_blank" rel="noopener noreferrer">{PHOTOWALK.transport}</a></dd></div>
              <div><dt>Pro koho</dt><dd>Hlavně majitelé OPPO a OnePlus, přijít ale může každý</dd></div>
              <div><dt>Cena</dt><dd>Zdarma, každý navíc dostane voucher 500 Kč</dd></div>
            </dl>
          </div>
          <div className="pw-form-card">
            {open ? (
              <SignupForm brands={PHOTOWALK.brands} otherBrand={PHOTOWALK.otherBrand} turnstileKey={TURNSTILE_SITE_KEY} waitlist={full} deadline={deadline} />
            ) : (
              <div className="pw-done">
                <h3>Přihlašování skončilo</h3>
                <p>
                  Přihlášky jsme brali do {deadline} Kdybyste se chtěli přidat na poslední chvíli, napište nám na{' '}
                  <a href={`mailto:${ORGANIZER.email}`}>{ORGANIZER.email}</a>.
                </p>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="section" id="program">
        <div className="container">
          <h2 className="h2 h2-wide">Jak bude odpoledne vypadat</h2>
          <div className="pw-program">
            <ol className="pw-steps">
              {PHOTOWALK.program.map((it) => (
                <li key={it.time} className="pw-step">
                  <span className="pw-step-time">{it.time}</span>
                  <div>
                    <h3>{it.title}</h3>
                    <p>{it.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="pw-route">
              {map && (
                <div className="pw-frame">
                  <img src={map} alt="Mapa trasy po Vyšehradě se zastávkami 1 až 7" loading="lazy" />
                </div>
              )}
              <ol className="pw-stops">
                {PHOTOWALK.stops.map((s, i) => (
                  <li key={s.name}>
                    <span className="pw-stop-num">{i + 1}</span>
                    <span><strong>{s.name}</strong><br /><span className="muted">{s.theme}</span></span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      </section>

      <section className="section paper">
        <div className="container pw-martin">
          {portrait && <img className="pw-portrait" src={portrait} alt="Fotograf Martin Rak" loading="lazy" />}
          <div className="pw-martin-text">
            <blockquote>„Fotografování přírody je pro mě především relax a tak trochu dobrodružství.“</blockquote>
            <p className="pw-martin-name">{PHOTOWALK.photographer.name}, krajinářský fotograf, Praha</p>
            <ul className="pw-martin-facts">
              <li>Fotí krajinu od roku 2009, jeho snímky vycházejí v zahraničních fotomagazínech</li>
              <li>Ocenění EISA Maestro, Sony World Photography Awards, IPA a Px3 Paris</li>
              <li>Fotokniha Komorebi, výstava v Českém centru Tel Aviv, workshopy v Tatrách nebo ve Slovinsku</li>
            </ul>
            <p className="pw-martin-links">
              <a href={PHOTOWALK.photographer.instagram} target="_blank" rel="noopener noreferrer">Instagram</a>
              <a href={PHOTOWALK.photographer.web} target="_blank" rel="noopener noreferrer">martinrak.cz</a>
            </p>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <h2 className="h2 h2-wide">Co si odnesete</h2>
          <div className="pw-voucher">
            <span className="pw-voucher-amount">500 Kč</span>
            <span className="pw-voucher-text"><strong>Pro každého účastníka</strong><br />Voucher na e-shop OPPO, platí při nákupu od 4 000 Kč.</span>
          </div>
          <ul className="pw-gets">
            <li><strong>Rady přímo u motivu.</strong> Ve chvíli, kdy máte telefon v ruce, ne až doma u počítače.</li>
            <li><strong>Hodnocení od Martina.</strong> Projde vaše snímky a ty nejlepší ocení přímo na místě.</li>
            <li><strong>Vaše fotky na sítích OPPO.</strong> Vybrané snímky z procházky zveřejníme na našich účtech.</li>
            <li><strong>Start v OPPO Photo Contest.</strong> Fotky z Vyšehradu můžete rovnou poslat do soutěže Lovci světla.</li>
          </ul>

          <div className="pw-before">
            <div className="pw-before-card">
              <h3>Sbalte si</h3>
              <ul className="pw-check">
                <li>Nabitý telefon</li>
                <li>Powerbanku</li>
                <li>Teplou bundu a pohodlné boty</li>
              </ul>
              <p className="small muted">Na vyzkoušení budeme mít i Find X10 s telekonvertorem.</p>
            </div>
            <div className="pw-before-card">
              <h3>Dobré vědět</h3>
              <p>Většinu času jsme venku. Kdyby počasí něco změnilo, dáme přihlášeným vědět e-mailem předem.</p>
              <p>Kolegyně Jana bude během odpoledne fotit a natáčet pro sítě OPPO. Kdo nechce být v záběru, stačí jí to říct.</p>
              <p className="small muted">Dotazy: <a href={`mailto:${ORGANIZER.email}`}>{ORGANIZER.email}</a></p>
            </div>
          </div>

          {open && (
            <p style={{ marginTop: 40 }}>
              <a href="#prihlaska" className="btn btn-black">{full ? 'Zapsat se mezi náhradníky' : 'Rezervovat si místo'}</a>
            </p>
          )}
        </div>
      </section>
    </>
  );
}
