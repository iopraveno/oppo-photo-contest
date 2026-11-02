import type { Metadata } from 'next';
import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { createAdminClient } from '@/lib/supabase/admin';
import { getStats, type Entry } from '@/lib/data';
import { CONTEST } from '@/lib/config';
import { addEntry, deleteEntry, setHidden } from './actions';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Administrace', robots: { index: false, follow: false } };

type Search = Promise<{ ok?: string; err?: string }>;

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' });

export default async function AdminPage({ searchParams }: { searchParams: Search }) {
  const user = await requireAdmin();
  const { ok, err } = await searchParams;
  const supabase = createAdminClient();
  const [{ data }, stats] = await Promise.all([
    supabase.from('entry_scores').select('*').order('created_at', { ascending: false }),
    getStats(),
  ]);
  const entries = (data ?? []) as Entry[];
  const perAuthor = new Map<string, number>();
  entries.forEach((e) => perAuthor.set(e.author_handle, (perAuthor.get(e.author_handle) ?? 0) + 1));

  return (
    <section className="section">
      <div className="container" style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <p className="eyebrow">Administrace | {user.email}</p>
          <h1 className="section-title">Správa soutěže</h1>
          <p className="muted">
            Jednou až dvakrát denně projdi na Instagramu {CONTEST.hashtag} a označení @{CONTEST.instagramHandle} a nové příspěvky
            přidej sem. <Link href="/admin/hlasy">Kontrola hlasů</Link> | <a href="/api/admin/export?typ=fotky">Export fotek (CSV)</a> |{' '}
            <a href="/api/admin/export?typ=hlasy">Export hlasů (CSV)</a>
          </p>
        </div>

        {ok && <p className="alert alert-ok">{ok}</p>}
        {err && <p className="alert alert-err">{err}</p>}

        <div className="stats">
          <div className="stat"><div className="stat-num">{stats.entrants}</div><div className="muted">soutěžících (milník)</div></div>
          <div className="stat"><div className="stat-num">{stats.photos}</div><div className="muted">fotek v galerii</div></div>
          <div className="stat"><div className="stat-num">{stats.votes}</div><div className="muted">hlasů</div></div>
        </div>

        <div className="card">
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Přidat příspěvek</h2>
          <form action={addEntry} className="form" style={{ maxWidth: 560 }}>
            <div className="field">
              <label htmlFor="url">Odkaz na příspěvek</label>
              <input id="url" name="url" className="input" placeholder="https://www.instagram.com/p/…" required />
            </div>
            <div className="field">
              <label htmlFor="handle">Instagram autora (bez @)</label>
              <input id="handle" name="handle" className="input" placeholder="jana.foti" required />
            </div>
            <label className="checkbox"><input type="checkbox" name="oppo" /> V popisku je {CONTEST.oppoHashtag}</label>
            <label className="checkbox"><input type="checkbox" name="force" /> Přidat i přes limit (víc než 1 fotka týdně nebo víc než {CONTEST.maxEntriesPerPerson})</label>
            <button type="submit" className="btn btn-primary">Schválit a přidat do galerie</button>
          </form>
          <p className="small muted" style={{ marginTop: 12 }}>
            Před přidáním zkontroluj: fotka sedí do tématu, účet je veřejný a sleduje nás, příspěvek je jedna fotka a v popisku je {CONTEST.hashtag}.
          </p>
        </div>

        <div className="card" style={{ overflowX: 'auto' }}>
          <h2 style={{ fontSize: 24, marginBottom: 16 }}>Fotky ({entries.length})</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Autor</th>
                <th>Příspěvek</th>
                <th>Hlasy</th>
                <th>Přidáno</th>
                <th>Akce</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id} className={e.hidden ? 'is-hidden' : undefined}>
                  <td>
                    <a href={`https://www.instagram.com/${e.author_handle}/`} target="_blank" rel="noopener noreferrer">@{e.author_handle}</a>
                    {e.shot_on_oppo && <span className="badge">OPPO</span>}
                    {(perAuthor.get(e.author_handle) ?? 0) > CONTEST.maxEntriesPerPerson && <span className="badge">nad limit</span>}
                    {e.hidden && <span className="badge">skryto</span>}
                  </td>
                  <td><a href={e.permalink} target="_blank" rel="noopener noreferrer">{e.shortcode}</a></td>
                  <td><Link href={`/admin/hlasy?fotka=${e.id}`}>{e.votes}</Link></td>
                  <td>{timeFmt.format(new Date(e.created_at))}</td>
                  <td>
                    <div className="row-actions">
                      <form action={setHidden}>
                        <input type="hidden" name="id" value={e.id} />
                        <input type="hidden" name="hidden" value={e.hidden ? 'false' : 'true'} />
                        <button className="btn btn-ghost btn-small" type="submit">{e.hidden ? 'Zobrazit' : 'Skrýt'}</button>
                      </form>
                      <form action={deleteEntry} className="row-actions">
                        <input type="hidden" name="id" value={e.id} />
                        <input name="confirm" className="input" placeholder="ano" style={{ width: 64, minHeight: 38 }} aria-label="Potvrzení smazání" />
                        <button className="btn btn-dark btn-small" type="submit">Smazat</button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
