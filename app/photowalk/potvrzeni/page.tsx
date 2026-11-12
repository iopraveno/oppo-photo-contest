import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { PHOTOWALK } from '@/lib/config';
import {
  attendanceOpen,
  eventDayLabel,
  eventTimeLabel,
  findSignupByToken,
  getSeatCounts,
  googleCalendarUrl,
  RSVP_SAMPLE,
  type Signup,
} from '@/lib/photowalk';
import { answerAttendance } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = {
  title: 'Potvrzení účasti na photo walku',
  robots: { index: false, follow: false, nocache: true },
};

type Search = Promise<{ t?: string; v?: string; chyba?: string; ukazka?: string }>;

const SAMPLE: Signup = {
  id: 'ukazka',
  event: PHOTOWALK.slug,
  name: 'Jan Ukázka',
  email: 'ukazka@example.com',
  phone: '',
  brand: 'OPPO',
  model: 'Find X10',
  status: 'confirmed',
  created_at: new Date().toISOString(),
  confirmed_at: new Date().toISOString(),
  confirm_email_sent_at: null,
  attendance: null,
};

const phoneHref = `tel:${PHOTOWALK.contactPhone.replace(/\s/g, '')}`;

function Answer({ token, answer, label, primary }: { token: string; answer: 'yes' | 'no'; label: string; primary: boolean }) {
  return (
    <form action={answerAttendance}>
      <input type="hidden" name="t" value={token} />
      <input type="hidden" name="answer" value={answer} />
      <button type="submit" className={`btn ${primary ? 'btn-black' : 'btn-ghost'}`}>{label}</button>
    </form>
  );
}

function Facts({ name }: { name: string }) {
  return (
    <dl className="pw-rsvp-facts">
      <div><dt>Kdy</dt><dd>{eventDayLabel()}, {eventTimeLabel()}</dd></div>
      <div><dt>Sraz</dt><dd>{PHOTOWALK.place}, {PHOTOWALK.address}, <a href={PHOTOWALK.mapsUrl} target="_blank" rel="noopener noreferrer">{PHOTOWALK.transport}</a></dd></div>
      <div><dt>Přihláška</dt><dd>{name}</dd></div>
    </dl>
  );
}

export default async function AttendancePage({ searchParams }: { searchParams: Search }) {
  const { t = '', v, chyba, ukazka } = await searchParams;
  const sample = t === RSVP_SAMPLE;
  let s: Signup | null = sample ? { ...SAMPLE } : await findSignupByToken(t);
  if (s && sample && ukazka === 'yes') s = { ...s, attendance: 'yes' };
  if (s && sample && ukazka === 'no') s = { ...s, status: 'declined', attendance: 'no' };

  const open = attendanceOpen();
  const counts = s && s.status === 'declined' && s.attendance === 'no' ? await getSeatCounts() : null;
  const placeStillFree = counts ? counts.confirmed < PHOTOWALK.capacity : false;

  let title: string;
  let body: ReactNode;

  if (!s) {
    title = 'Odkaz nesedí';
    body = (
      <p className="pw-rsvp-text">
        Zkuste ho prosím otevřít znovu přímo z e-mailu. Kdyby to pořád nešlo, zavolejte nám na{' '}
        <a href={phoneHref}>{PHOTOWALK.contactPhone}</a> nebo odpovězte na e-mail, který vám od nás přišel.
      </p>
    );
  } else if (!open) {
    title = 'Photo walk už začal';
    body = (
      <p className="pw-rsvp-text">
        Odpovědi jsme sbírali do začátku akce. Kdybyste nás potřebovali zastihnout, volejte na{' '}
        <a href={phoneHref}>{PHOTOWALK.contactPhone}</a>.
      </p>
    );
  } else if (s.status === 'confirmed' && s.attendance === 'yes') {
    title = 'Počítáme s vámi';
    body = (
      <>
        <p className="pw-rsvp-text">
          Díky za potvrzení. Uvidíme se {eventDayLabel().replace(/^sobota/, 'v sobotu')} ve 14:00 ve {PHOTOWALK.place}. S sebou nabitý
          telefon, powerbanku a teplé oblečení.
        </p>
        <Facts name={s.name} />
        <div className="pw-rsvp-actions">
          <a className="btn btn-black" href={googleCalendarUrl()} target="_blank" rel="noopener noreferrer">Přidat do Google Kalendáře</a>
          <a className="btn btn-ghost" href="/photowalk/kalendar.ics">Apple a Outlook</a>
        </div>
        <div className="pw-rsvp-change">
          <p className="small muted">Plány se změnily?</p>
          <Answer token={t} answer="no" label="Nakonec nedorazím, uvolnit místo" primary={false} />
        </div>
      </>
    );
  } else if (s.status === 'confirmed') {
    const wantsNo = v === 'ne';
    title = wantsNo ? 'Uvolníte místo?' : 'Dorazíte v sobotu?';
    body = (
      <>
        <p className="pw-rsvp-text">
          {wantsNo
            ? 'Škoda, ale díky, že dáváte vědět. Jedním klepnutím místo uvolníte a nabídneme ho někomu z náhradníků.'
            : `Máte jedno z ${PHOTOWALK.capacity} míst. Dejte nám prosím vědět, jestli platí, že dorazíte. Když to nevyjde, uvolněte místo, ať ho můžeme nabídnout někomu z náhradníků.`}
        </p>
        <Facts name={s.name} />
        <div className="pw-rsvp-actions">
          {wantsNo ? (
            <>
              <Answer token={t} answer="no" label="Nedorazím, uvolnit místo" primary />
              <Answer token={t} answer="yes" label="Ale ne, dorazím" primary={false} />
            </>
          ) : (
            <>
              <Answer token={t} answer="yes" label="Ano, dorazím" primary />
              <Answer token={t} answer="no" label="Nedorazím, uvolnit místo" primary={false} />
            </>
          )}
        </div>
      </>
    );
  } else if (s.status === 'declined' && s.attendance === 'no') {
    title = 'Místo jste uvolnili';
    body = (
      <>
        {chyba === 'plno' && (
          <p className="alert alert-err">Místo mezitím dostal někdo z náhradníků a teď je plno. Kdyby se něco uvolnilo, ozveme se.</p>
        )}
        <p className="pw-rsvp-text">Díky, že jste dali vědět. Místo nabídneme někomu z náhradníků. Snad to vyjde příště.</p>
        {placeStillFree && chyba !== 'plno' && (
          <div className="pw-rsvp-change">
            <p className="small muted">Nakonec to přece jen stihnete? Místo je zatím volné.</p>
            <Answer token={t} answer="yes" label="Nakonec dorazím" primary={false} />
          </div>
        )}
      </>
    );
  } else {
    title = 'Místo zatím nemáte potvrzené';
    body = (
      <p className="pw-rsvp-text">
        Přihlášku máme, ale místo vám zatím nepotvrdili. Kdyby se některé uvolnilo, hned se ozveme e-mailem. S dotazem volejte na{' '}
        <a href={phoneHref}>{PHOTOWALK.contactPhone}</a>.
      </p>
    );
  }

  return (
    <section className="dark pw-rsvp-band">
      <div className="container pw-rsvp">
        <div className="pw-form-card pw-rsvp-card">
          {sample && <p className="alert alert-info">Tohle je ukázka stránky z připomínky. Odpovědi se tady neukládají.</p>}
          <h1 className="pw-rsvp-title">{title}</h1>
          {body}
        </div>
      </div>
    </section>
  );
}
