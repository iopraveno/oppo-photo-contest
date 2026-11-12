import type { Metadata } from 'next';
import Link from 'next/link';
import { isAdminEmail, requirePhotowalkAdmin } from '@/lib/auth';
import { PHOTOWALK } from '@/lib/config';
import { attendanceReady, listSignups, type Signup } from '@/lib/photowalk';
import { isMailConfigured, mailSetupSummary } from '@/lib/mail';
import Seats from '@/components/Seats';
import { confirmSignup, deleteSignup, resendConfirmation, sendReminder, sendReminders, sendReminderTest, sendTestEmail, setSignupStatus } from './actions';

export const dynamic = 'force-dynamic';
// Sending the reminder to everyone goes one e-mail at a time over SMTP.
export const maxDuration = 60;
export const metadata: Metadata = { title: 'Photo walk: přihlášky', robots: { index: false, follow: false } };

type Search = Promise<{ ok?: string; err?: string }>;

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' });
const t = (iso: string | null | undefined) => (iso ? timeFmt.format(new Date(iso)) : '');

const MIGRATION = `alter table public.photowalk_signups
  add column if not exists rsvp_token       uuid not null default gen_random_uuid(),
  add column if not exists attendance       text check (attendance in ('yes', 'no')),
  add column if not exists attendance_at    timestamptz,
  add column if not exists reminder_sent_at timestamptz;
create unique index if not exists photowalk_signups_rsvp_token_idx on public.photowalk_signups (rsvp_token);`;

/** The participant's own answer from /photowalk/potvrzeni. */
function Attendance({ s }: { s: Signup }) {
  if (s.status === 'confirmed' && s.attendance === 'yes') {
    return <span className="small"><span className="att att-yes">Dorazí</span><br /><span className="muted">potvrdil(a) {t(s.attendance_at)}</span></span>;
  }
  if (s.status === 'confirmed') {
    return (
      <span className="small">
        <span className="att att-none">Bez odpovědi</span>
        <br />
        <span className="muted">{s.reminder_sent_at ? `připomínka ${t(s.reminder_sent_at)}` : 'připomínka zatím neodešla'}</span>
      </span>
    );
  }
  if (s.attendance === 'no') {
    return <span className="small"><span className="att att-no">Uvolnil(a) místo</span><br /><span className="muted">{t(s.attendance_at)}</span></span>;
  }
  return null;
}

function Row({ s, full, attendance }: { s: Signup; full: boolean; attendance: boolean }) {
  return (
    <tr className={s.status === 'declined' ? 'is-hidden' : undefined}>
      <td>
        <strong>{s.name}</strong>
        <div className="small"><a href={`mailto:${s.email}`}>{s.email}</a></div>
      </td>
      <td style={{ whiteSpace: 'nowrap' }}><a href={`tel:${s.phone.replace(/\s/g, '')}`}>{s.phone}</a></td>
      <td>
        <span className="badge" style={{ marginLeft: 0 }}>{s.brand === PHOTOWALK.otherBrand ? 'jiná' : s.brand}</span> {s.model}
      </td>
      <td style={{ whiteSpace: 'nowrap' }}>{t(s.created_at)}</td>
      <td>
        {s.status === 'confirmed' && (
          <span className="small">
            potvrzeno {t(s.confirmed_at)}
            <br />
            {s.confirm_email_sent_at ? <span className="muted">e-mail {t(s.confirm_email_sent_at)}</span> : <strong>e-mail neodešel</strong>}
          </span>
        )}
        {s.status === 'pending' && <span className="small muted">čeká</span>}
        {s.status === 'declined' && <span className="small muted">{s.attendance === 'no' ? 'nedorazí' : 'odmítnuto'}</span>}
      </td>
      {attendance && <td><Attendance s={s} /></td>}
      <td>
        <div className="row-actions">
          {s.status !== 'confirmed' && (
            <form action={confirmSignup}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn btn-black btn-small" type="submit" disabled={full} title={full ? 'Kapacita je plná' : undefined}>
                Potvrdit místo
              </button>
            </form>
          )}
          {attendance && s.status === 'confirmed' && s.attendance !== 'yes' && (
            <form action={sendReminder}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn btn-ghost btn-small" type="submit">{s.reminder_sent_at ? 'Připomenout znovu' : 'Poslat připomínku'}</button>
            </form>
          )}
          {s.status === 'confirmed' && (
            <form action={resendConfirmation}>
              <input type="hidden" name="id" value={s.id} />
              <button className="btn btn-ghost btn-small" type="submit">Poslat e-mail znovu</button>
            </form>
          )}
          {s.status !== 'pending' && (
            <form action={setSignupStatus}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="status" value="pending" />
              <button className="btn btn-ghost btn-small" type="submit">{s.status === 'confirmed' ? 'Uvolnit místo' : 'Vrátit mezi čekající'}</button>
            </form>
          )}
          {s.status === 'pending' && (
            <form action={setSignupStatus}>
              <input type="hidden" name="id" value={s.id} />
              <input type="hidden" name="status" value="declined" />
              <button className="btn btn-ghost btn-small" type="submit">Odmítnout</button>
            </form>
          )}
          <form action={deleteSignup} className="row-actions">
            <input type="hidden" name="id" value={s.id} />
            <input name="confirm" className="input" placeholder="ano" style={{ width: 56, minHeight: 38 }} aria-label="Potvrzení smazání" />
            <button className="btn btn-ghost btn-small" type="submit">Smazat</button>
          </form>
        </div>
      </td>
    </tr>
  );
}

function Table({ title, rows, full, empty, attendance = false }: { title: string; rows: Signup[]; full: boolean; empty: string; attendance?: boolean }) {
  return (
    <div className="card" style={{ overflowX: 'auto' }}>
      <h2 style={{ fontSize: 22, marginBottom: 12 }}>{title} ({rows.length})</h2>
      {rows.length === 0 ? (
        <p className="muted small">{empty}</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Jméno a e-mail</th>
              <th>Telefon</th>
              <th>Model</th>
              <th>Přihlášeno</th>
              <th>Stav</th>
              {attendance && <th>Účast</th>}
              <th>Akce</th>
            </tr>
          </thead>
          <tbody>{rows.map((s) => <Row key={s.id} s={s} full={full} attendance={attendance} />)}</tbody>
        </table>
      )}
    </div>
  );
}

export default async function PhotoWalkAdmin({ searchParams }: { searchParams: Search }) {
  const user = await requirePhotowalkAdmin();
  const fullAdmin = isAdminEmail(user.email);
  const mail = mailSetupSummary();
  const { ok, err } = await searchParams;
  const all = await listSignups();
  const confirmed = all.filter((s) => s.status === 'confirmed');
  const pending = all.filter((s) => s.status === 'pending');
  const declined = all.filter((s) => s.status === 'declined');
  const full = confirmed.length >= PHOTOWALK.capacity;
  const free = Math.max(PHOTOWALK.capacity - confirmed.length, 0);
  const ready = await attendanceReady();
  const coming = confirmed.filter((s) => s.attendance === 'yes').length;
  const noAnswer = confirmed.filter((s) => !s.attendance);
  const notReminded = noAnswer.filter((s) => !s.reminder_sent_at).length;
  const gaveUp = declined.filter((s) => s.attendance === 'no').length;
  const notifyTeam = Boolean((process.env.PHOTOWALK_NOTIFY_EMAILS || '').trim());

  return (
    <section className="section">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
        <div>
          <h1 className="section-title" style={{ marginBottom: 12 }}>Photo walk s Martinem Rakem</h1>
          <p className="muted">
            Přihlášky z <Link href="/photowalk">/photowalk</Link>. Po kliknutí na „Potvrdit místo“ se zaplní čtvereček na webu a
            účastníkovi odejde potvrzovací e-mail s pozvánkou do kalendáře.{' '}
            {fullAdmin && <><Link href="/admin">Zpět do administrace</Link> |{' '}</>}
            <a href="/api/admin/export?typ=photowalk">Export přihlášek (CSV)</a>
          </p>
        </div>

        {ok && <p className="alert alert-ok">{ok}</p>}
        {err && <p className="alert alert-err">{err}</p>}
        {!isMailConfigured() && (
          <p className="alert alert-err">
            E-maily se zatím neposílají: na Vercelu chybí SMTP_HOST, SMTP_USER a SMTP_PASS (viz README, sekce Photo walk).
          </p>
        )}

        <div className="card" style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <p className="small" style={{ margin: 0 }}>
            <strong>E-maily:</strong> {mail.host}:{mail.port} | přihlášení <code>{mail.user}</code> | heslo{' '}
            {mail.passLength ? 'nastavené' : <strong>chybí</strong>} | odesílatel <code>{mail.from}</code>
          </p>
          <form action={sendTestEmail}>
            <button className="btn btn-ghost btn-small" type="submit">Poslat testovací e-mail na {user.email}</button>
          </form>
        </div>

        <div className="card pw-admin-seats">
          <Seats filled={confirmed.length} total={PHOTOWALK.capacity} size="lg" />
          <div className="stats" style={{ marginTop: 20 }}>
            <div className="stat"><div className="stat-num">{confirmed.length} / {PHOTOWALK.capacity}</div><div className="muted">potvrzeno</div></div>
            <div className="stat"><div className="stat-num">{free}</div><div className="muted">volných míst</div></div>
            <div className="stat"><div className="stat-num">{pending.length}</div><div className="muted">čeká na potvrzení</div></div>
            <div className="stat"><div className="stat-num">{declined.length}</div><div className="muted">odmítnuto</div></div>
          </div>
          {confirmed.length > 0 && (
            <p className="small muted" style={{ marginTop: 16 }}>
              E-maily potvrzených (pro hromadnou zprávu do skryté kopie):{' '}
              <code style={{ userSelect: 'all' }}>{confirmed.map((s) => s.email).join(', ')}</code>
            </p>
          )}
        </div>

        {ready ? (
          <div className="card">
            <h2 style={{ fontSize: 22, marginBottom: 8 }}>Připomínka před akcí</h2>
            <p className="small muted" style={{ maxWidth: '62em', margin: 0 }}>
              Potvrzeným odejde e-mail „Dorazíte v sobotu?“ s osobním odkazem na stránku, kde jedním klepnutím potvrdí účast, nebo
              místo uvolní. Kdo místo uvolní, přesune se mezi odmítnuté a na webu se vyprázdní jeho čtvereček, takže můžeš potvrdit
              náhradníka.{' '}
              {notifyTeam
                ? 'Když někdo místo uvolní, přijde upozornění na adresy z PHOTOWALK_NOTIFY_EMAILS.'
                : 'Upozornění na uvolněná místa se neposílají, protože na Vercelu chybí PHOTOWALK_NOTIFY_EMAILS. Sleduj proto tenhle přehled.'}
            </p>
            <div className="stats" style={{ marginTop: 18 }}>
              <div className="stat"><div className="stat-num">{coming} / {confirmed.length}</div><div className="muted">potvrdilo, že dorazí</div></div>
              <div className="stat"><div className="stat-num">{noAnswer.length}</div><div className="muted">bez odpovědi</div></div>
              <div className="stat"><div className="stat-num">{gaveUp}</div><div className="muted">uvolnilo místo</div></div>
            </div>
            <div className="row-actions" style={{ marginTop: 18 }}>
              <form action={sendReminders}>
                <input type="hidden" name="mode" value="nove" />
                <button className="btn btn-black btn-small" type="submit" disabled={notReminded === 0}>
                  Poslat připomínku{notReminded ? ` (${notReminded})` : ''}
                </button>
              </form>
              <form action={sendReminders}>
                <input type="hidden" name="mode" value="znovu" />
                <button className="btn btn-ghost btn-small" type="submit" disabled={noAnswer.length === 0}>
                  Připomenout znovu všem bez odpovědi{noAnswer.length ? ` (${noAnswer.length})` : ''}
                </button>
              </form>
              <form action={sendReminderTest}>
                <button className="btn btn-ghost btn-small" type="submit">Ukázku připomínky na {user.email}</button>
              </form>
              <a className="btn btn-ghost btn-small" href="/photowalk/potvrzeni?t=ukazka" target="_blank" rel="noopener noreferrer">Ukázka stránky</a>
            </div>
          </div>
        ) : (
          <div className="alert alert-err">
            Pro připomínku a potvrzování účasti je potřeba jednou spustit v Supabase (SQL Editor → New query) tenhle kód. Je i v
            repu jako supabase/photowalk-ucast.sql.
            <pre className="pw-sql">{MIGRATION}</pre>
          </div>
        )}

        <Table title="Čekají na potvrzení" rows={pending} full={full} empty="Žádná nová přihláška." />
        <Table title="Potvrzení" rows={confirmed} full={full} empty="Zatím nikdo nemá potvrzené místo." attendance={ready} />
        {declined.length > 0 && <Table title="Odmítnutí" rows={declined} full={full} empty="" attendance={ready && gaveUp > 0} />}
      </div>
    </section>
  );
}
