import Link from 'next/link';
import { formatAnswer, formatResponseAnswer, labelOf, type Question, type SurveyDef } from '@/lib/survey';
import {
  SURVEY_VERSIONS,
  adminHref,
  applyFilters,
  countMatrix,
  countOptions,
  countRank,
  countSources,
  median,
  sourceLabel,
  type SurveyFilters,
  type SurveyResponse,
} from '@/lib/survey-data';
import { BarList, ORDINAL, RankList, SHAPE_COLORS, StackedRows, type Column } from './Charts';
import s from './admin.module.css';

const timeFmt = new Intl.DateTimeFormat('cs-CZ', { day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Prague' });
const when = (iso: string) => timeFmt.format(new Date(iso));
const TABLE_LIMIT = 300;

const SETUP_SQL = `-- Supabase → SQL Editor → vložit obsah souboru supabase/dotaznik.sql → Run`;

type TableColumn = { key: string; head: string; wrap: boolean; get: (r: SurveyResponse) => string };

/** Sheet-like columns: one per question, matrix questions split into one column per row, a ranking's tick box gets its own. */
function tableColumns(questions: Question[]): TableColumn[] {
  return questions.flatMap((q): TableColumn[] => {
    if (q.kind === 'matrix') {
      return q.rows.map((row) => ({
        key: `${q.id}.${row.value}`,
        head: `${q.short}: ${row.label}`,
        wrap: false,
        get: (r) => {
          const v = r.answers[q.id];
          const cell = v && typeof v === 'object' && !Array.isArray(v) ? v[row.value] : undefined;
          return cell ? labelOf(q, cell) : '';
        },
      }));
    }
    const main: TableColumn = {
      key: q.id,
      head: q.short,
      wrap: q.kind !== 'single' || q.style === 'list',
      get: (r) => formatResponseAnswer(q, r.answers),
    };
    if (q.kind !== 'rank' || !q.check) return [main];
    const id = q.check.id;
    return [main, { key: id, head: q.check.short, wrap: false, get: (r) => (r.answers[id] === 'ano' ? 'Ano' : r.answers[id] === 'ne' ? 'Ne' : '') }];
  });
}

const contactHref = (c: string) => (c.includes('@') ? `mailto:${c}` : `tel:${c.replace(/[^\d+]/g, '')}`); // older rows may hold a phone

function FilterSelect({ name, label, value, options }: { name: string; label: string; value?: string; options: { value: string; label: string }[] }) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value || ''}>
        <option value="">Vše</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  );
}

function QuestionCard({ q, rows }: { q: Question; rows: SurveyResponse[] }) {
  const who = q.audience ? `Ptali jsme se: ${q.audience.charAt(0).toLowerCase()}${q.audience.slice(1)}. ` : '';
  if (q.kind === 'matrix') {
    const data = countMatrix(rows, q);
    const columns: Column[] =
      q.style === 'shapes'
        ? q.columns.map((c) => ({ value: c.value, label: c.label, color: SHAPE_COLORS[c.value] ?? '#b9b8b2', dark: c.value === 'A' }))
        : q.columns.map((c, i) => ({ value: c.value, label: c.label, color: ORDINAL[i + (ORDINAL.length - q.columns.length)], dark: i >= 2 }));
    return (
      <div className={`${s.qCard} ${s.wide}`}>
        <h3 className={s.qTitle}>{q.title}</h3>
        <p className={s.qMeta}>{who}{data[0]?.answered ?? 0} odpovědí, podíly v každém řádku dávají 100 %</p>
        <StackedRows rows={data} columns={columns} />
      </div>
    );
  }
  if (q.kind === 'rank') {
    const { counts, answered } = countRank(rows, q);
    const check = q.check;
    const checked = check ? rows.filter((r) => Array.isArray(r.answers[q.id]) && r.answers[check.id] === 'ano').length : 0;
    return (
      <div className={s.qCard}>
        <h3 className={s.qTitle}>{q.title}</h3>
        <p className={s.qMeta}>{who}{answered} odpovědí, seřazeno podle toho, kolik lidí dalo zdroj na 1. místo. Procenta z respondentů.</p>
        <RankList counts={counts} total={answered} />
        {check && (
          <p className={s.checkLine}>
            {check.label}: <b>{answered ? Math.round((checked / answered) * 100) : 0} %</b> ({checked} z {answered})
          </p>
        )}
      </div>
    );
  }
  const { counts, answered } = countOptions(rows, q);
  const multi = q.kind === 'multi';
  const colors = q.id === 'pick' ? SHAPE_COLORS : undefined;
  return (
    <div className={s.qCard}>
      <h3 className={s.qTitle}>{q.title}</h3>
      <p className={s.qMeta}>
        {who}
        {answered} odpovědí
        {multi && q.ranked
          ? ', podíl odpovědí na 1. místě; celé pořadí je v tabulce a CSV'
          : multi
            ? `, mohli vybrat víc${q.max ? ` (nejvýš ${q.max})` : ''}: procenta z respondentů, nesčítají se do 100 %`
            : ''}
      </p>
      <BarList counts={counts} total={answered} colors={colors} />
    </div>
  );
}

export default function Dashboard({
  def,
  all,
  filters,
  fullAdmin,
  siteUrl,
}: {
  def: SurveyDef;
  all: SurveyResponse[] | null;
  filters: SurveyFilters;
  fullAdmin: boolean;
  siteUrl: string;
}) {
  const version = SURVEY_VERSIONS.find((v) => v.def.slug === def.slug) ?? SURVEY_VERSIONS[0];
  const base = adminHref(version.key);
  const q = (id: string) => def.questions.find((x) => x.id === id);
  const head = (
    <div className={s.head}>
      <nav className={s.switch} aria-label="Verze dotazníku">
        {SURVEY_VERSIONS.map((v) => (
          <Link
            key={v.def.slug}
            href={adminHref(v.key)}
            className={v.def.slug === def.slug ? s.switchOn : undefined}
            aria-current={v.def.slug === def.slug ? 'page' : undefined}
          >
            {v.def.name}
          </Link>
        ))}
      </nav>
      <h1 className="section-title" style={{ marginBottom: 12 }}>{def.adminTitle}</h1>
      <p className="muted">
        Odpovědi z <Link href={def.path}>{def.path}</Link>. Každý influencer nebo médium může dostat vlastní odkaz, třeba{' '}
        <code>{siteUrl.replace(/^https?:\/\//, '')}{def.path}?src=jmeno</code>. Zdroj se pak ukáže v přehledu i v exportu.
      </p>
      <div className={s.links}>
        <a href={`/api/admin/export?typ=${version.exportType}`}>Export všech odpovědí (CSV pro Google Sheets a Excel)</a>
        <Link href={def.path} target="_blank">Otevřít veřejnou stránku</Link>
        {fullAdmin && <Link href="/admin">Zpět do administrace</Link>}
      </div>
    </div>
  );

  if (all === null) {
    return (
      <div className={s.wrap}>
        {head}
        <div className={s.setup}>
          <strong>Tabulka pro odpovědi v databázi ještě není.</strong>
          <p className="small" style={{ margin: '8px 0' }}>Spusť jednou SQL ze souboru <code>supabase/dotaznik.sql</code>, pak se sem odpovědi začnou ukládat.</p>
          <pre>{SETUP_SQL}</pre>
        </div>
      </div>
    );
  }

  const rows = applyFilters(all, filters);
  const filtered = Object.values(filters).some(Boolean);
  const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
  const last24 = rows.filter((r) => new Date(r.created_at).getTime() >= dayAgo).length;
  const meeting = rows.filter((r) => r.wants_meeting && r.email);
  const emailOnly = rows.filter((r) => !r.wants_meeting && r.email);
  // Phone-or-e-mail surveys keep the meeting contact in open_answers (the email column is the newsletter there)
  // and list everyone who left one, with their answer to the meeting question.
  const meetContact = (r: SurveyResponse) => (def.meeting?.contactInOpenAnswers ? r.open_answers?.meet_contact : r.email) || '';
  const contacts = def.meeting?.contactInOpenAnswers ? rows.filter((r) => r.open_answers?.meet_contact) : meeting;
  const maybeCount = def.meeting?.contactInOpenAnswers ? contacts.filter((r) => !r.wants_meeting).length : emailOnly.length;
  const meetingCount = def.meeting?.contactInOpenAnswers ? contacts.filter((r) => r.wants_meeting).length : meeting.length;
  const newsletterCount = rows.filter((r) => r.contact_consent && r.email).length;
  const mobile = rows.filter((r) => r.device === 'mobil').length;
  const med = median(rows.map((r) => r.duration_s).filter((d): d is number => typeof d === 'number'));
  const sources = countSources(all);
  const opt = (id: string) => {
    const x = q(id);
    return !x || x.kind === 'matrix' ? [] : x.options.map((o) => ({ value: o.value, label: o.label }));
  };
  const meta = (r: SurveyResponse) => {
    const phone = q('phone');
    const age = q('age');
    return [
      phone && r.answers.phone ? formatAnswer(phone, r.answers.phone) : '',
      age && r.answers.age ? formatAnswer(age, r.answers.age) : '',
      when(r.created_at),
    ]
      .filter(Boolean)
      .join(', ');
  };
  const columns = tableColumns([...def.questions, ...(def.archivedQuestions ?? [])]);
  const sectionIds = Object.keys(def.sections);

  return (
    <div className={s.wrap}>
      {head}

      <div className={s.kpis}>
        <div className={s.kpi}>
          <div className={s.kpiValue}>{rows.length}</div>
          <div className={s.kpiLabel}>{filtered ? `odpovědí ve výběru (z ${all.length})` : 'odpovědí celkem'}</div>
        </div>
        <div className={s.kpi}>
          <div className={s.kpiValue}>{last24}</div>
          <div className={s.kpiLabel}>za posledních 24 hodin</div>
        </div>
        {def.meeting ? (
          <>
            <div className={s.kpi}>
              <div className={s.kpiValue}>{meetingCount}</div>
              <div className={s.kpiLabel}>chce pozvat na setkání</div>
            </div>
            <div className={s.kpi}>
              <div className={s.kpiValue}>{maybeCount}</div>
              <div className={s.kpiLabel}>{def.meeting.maybeLabel}</div>
            </div>
          </>
        ) : (
          <div className={s.kpi}>
            <div className={s.kpiValue}>{rows.length ? `${Math.round((mobile / rows.length) * 100)} %` : '-'}</div>
            <div className={s.kpiLabel}>vyplnilo na mobilu</div>
          </div>
        )}
        <div className={s.kpi}>
          <div className={s.kpiValue}>{med === null ? '-' : `${Math.floor(med / 60)}:${String(med % 60).padStart(2, '0')}`}</div>
          <div className={s.kpiLabel}>medián doby vyplnění (min:s)</div>
        </div>
        {def.newsletter && (
          <div className={s.kpi}>
            <div className={s.kpiValue}>{newsletterCount}</div>
            <div className={s.kpiLabel}>chce dostávat novinky OPPO</div>
          </div>
        )}
      </div>

      <form className={s.filters} method="get">
        {version.key && <input type="hidden" name="verze" value={version.key} />}
        <FilterSelect name="src" label="Zdroj" value={filters.src} options={sources.map((x) => ({ value: x.value, label: x.label }))} />
        {def.filters.map((id) => (
          <FilterSelect key={id} name={id} label={q(id)?.short ?? id} value={filters[id]} options={opt(id)} />
        ))}
        <FilterSelect name="device" label="Zařízení" value={filters.device} options={[{ value: 'mobil', label: 'Mobil' }, { value: 'pocitac', label: 'Počítač' }]} />
        {def.meeting && (
          <FilterSelect name="meet" label="Setkání" value={filters.meet} options={[{ value: 'ano', label: 'Chce pozvat' }, { value: 'ne', label: 'Nechce' }]} />
        )}
        <button className="btn btn-black btn-small" type="submit">Filtrovat</button>
        {filtered && <Link className={s.filterNote} href={base}>Zrušit filtry</Link>}
      </form>

      {all.length === 0 ? (
        <p className="muted">Zatím tu nejsou žádné odpovědi. Jakmile někdo odpoví, objeví se tady.</p>
      ) : (
        <>
          <section className={s.section}>
            <h2 className={s.sectionTitle}>Odkud lidé přišli</h2>
            <div className={s.grid}>
              <div className={s.qCard}>
                <h3 className={s.qTitle}>Zdroj odkazu</h3>
                <p className={s.qMeta}>Všechny odpovědi, bez filtru</p>
                <BarList counts={sources.slice(0, 12)} total={all.length} />
              </div>
            </div>
          </section>

          {sectionIds.map((sec) => (
            <section key={sec} className={s.section}>
              <h2 className={s.sectionTitle}>{def.sections[sec]}</h2>
              <div className={s.grid}>
                {def.questions.filter((x) => x.section === sec).map((x) => (
                  <QuestionCard key={x.id} q={x} rows={rows} />
                ))}
              </div>
            </section>
          ))}

          {def.open.length > 0 && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>Volné odpovědi</h2>
              <div className={s.grid}>
                {def.open.map((o) => {
                  const list = rows.filter((r) => r.open_answers?.[o.id]);
                  return (
                    <div key={o.id} className={s.qCard}>
                      <h3 className={s.qTitle}>{o.label}</h3>
                      <p className={s.qMeta}>{list.length} odpovědí, nejnovější nahoře</p>
                      <div className={s.quotes}>
                        {list.length === 0 && <p className="muted small">Zatím nic.</p>}
                        {list.slice(0, 200).map((r) => (
                          <p key={r.id} className={s.quote}>
                            {r.open_answers[o.id]}
                            <span className={s.quoteMeta}>{meta(r)}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {def.meeting && (
            <section className={s.section}>
              <h2 className={s.sectionTitle}>
                {def.meeting.contactInOpenAnswers ? `Nechali e-mail kvůli setkání (${contacts.length})` : `Chtějí pozvat na osobní setkání (${contacts.length})`}
              </h2>
              <p className="muted small">
                {def.meeting.contactInOpenAnswers
                  ? 'Lidé, kteří chtějí na setkání nebo odpověděli „možná“, nechali e-mail a dali souhlas. Podle odpovědí si vyberte, koho pozvete.'
                  : 'Lidé, kteří chtějí na setkání a dali souhlas s kontaktováním. Podle odpovědí si vyberte, koho pozvete.'}
              </p>
              {contacts.length === 0 ? (
                <p className="muted">Zatím nikdo.</p>
              ) : (
                <div className={s.tableWrap}>
                  <table className={s.table}>
                    <thead>
                      <tr>
                        <th>E-mail</th>
                        {def.meeting.contactInOpenAnswers && <th>Setkání</th>}
                        <th>Odesláno</th>
                        {def.meeting.cols.map((id) => <th key={id}>{q(id)?.short ?? id}</th>)}
                        <th>Zdroj</th>
                      </tr>
                    </thead>
                    <tbody>
                      {contacts.map((r) => (
                        <tr key={r.id}>
                          <td><a href={contactHref(meetContact(r))}>{meetContact(r)}</a></td>
                          {def.meeting!.contactInOpenAnswers && <td>{r.wants_meeting ? <span className={s.yes}>Ano</span> : 'Možná'}</td>}
                          <td>{when(r.created_at)}</td>
                          {def.meeting!.cols.map((id) => {
                            const x = q(id);
                            return (
                              <td key={id} className={x && x.kind !== 'single' ? s.wrapCell : undefined}>
                                {x ? formatAnswer(x, r.answers[id]) : ''}
                              </td>
                            );
                          })}
                          <td>{sourceLabel(r.src)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
              {!def.meeting.contactInOpenAnswers && emailOnly.length > 0 && (
                <p className="small muted">
                  Dalších {emailOnly.length} lidí nechalo e-mail jen pro případné vyzkoušení. Najdete je v exportu CSV.
                </p>
              )}
            </section>
          )}

          <section className={s.section}>
            <h2 className={s.sectionTitle}>Tabulka odpovědí</h2>
            <p className="muted small">
              {rows.length > TABLE_LIMIT ? `Posledních ${TABLE_LIMIT} odpovědí z ${rows.length}. ` : ''}Všechny odpovědi jsou v exportu CSV,
              který otevřete v Google Sheets (Soubor, Importovat) nebo v Excelu.
            </p>
            <div className={s.tableWrap}>
              <table className={s.table}>
                <thead>
                  <tr>
                    <th>Odesláno</th>
                    <th>Zdroj</th>
                    <th>Zařízení</th>
                    {columns.map((c) => <th key={c.key}>{c.head}</th>)}
                    {def.meeting && <th>Setkání</th>}
                    {def.meeting?.contactInOpenAnswers && <th>E-mail na setkání</th>}
                    {def.newsletter && (
                      <>
                        <th>E-mail pro novinky</th>
                        <th>Souhlas s novinkami</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, TABLE_LIMIT).map((r) => (
                    <tr key={r.id}>
                      <td>{when(r.created_at)}</td>
                      <td>{sourceLabel(r.src)}</td>
                      <td>{r.device === 'mobil' ? 'Mobil' : r.device === 'pocitac' ? 'Počítač' : ''}</td>
                      {columns.map((c) => (
                        <td key={c.key} className={c.wrap ? s.wrapCell : undefined}>{c.get(r)}</td>
                      ))}
                      {def.meeting && <td>{r.wants_meeting ? <span className={s.yes}>Ano</span> : r.wants_meeting === false ? 'Ne' : ''}</td>}
                      {def.meeting?.contactInOpenAnswers && <td>{r.open_answers?.meet_contact ?? ''}</td>}
                      {def.newsletter && (
                        <>
                          <td>{r.contact_consent ? r.email : ''}</td>
                          <td>{r.contact_consent ? 'Ano' : 'Ne'}</td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
