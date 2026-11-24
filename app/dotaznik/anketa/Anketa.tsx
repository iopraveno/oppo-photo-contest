'use client';

import { Fragment, useEffect, useRef, useState } from 'react';
import { isAnswered, type Answers, type AnswerValue, type Option, type Question, type RankQuestion } from '@/lib/survey';
import { ANKETA, ANKETA_TEXT, MESSAGE, anketaFlow, anketaLength, contactKind, otherKey } from '@/lib/survey-anketa';
import { ANKETA_CONSENT_TEXT, cleanAnketaContact } from '@/lib/anketa-contact';
import { submitAnketa } from './actions';
import FormatCompare from './FormatCompare';
import s from './anketa.module.css';

const DRAFT_KEY = `oppo-anketa-${ANKETA.slug}`;
const DONE_KEY = `${DRAFT_KEY}-hotovo`;

type Open = Record<string, string>;
type Contact = { value: string; name: string; consent: boolean };
// Contact details and consents stay in memory only, never in the browser draft.
type Draft = { answers: Answers; open: Open; reached: number; startedAt: number; newsletterStep?: boolean };

const NO_CONTACT: Contact = { value: '', name: '', consent: false };
const BY_ID = new Map(ANKETA.questions.map((q) => [q.id, q]));

const store = {
  get<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : null;
    } catch {
      return null;
    }
  },
  set(key: string, value: unknown) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage blocked: the poll still works */
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const firstDiff = (a: string[], b: string[]) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};
const wantsContact = (meet: AnswerValue | undefined) => meet === 'ano' || meet === 'mozna';

/** Czech typesetting: a one-letter word (v, s, k, a, i…) never ends a line, it is glued to the next word. */
const ONE_LETTER = /(^|[\s(])([aikosuvzAIKOSUVZ]) /g;
const cz = (text: string) => text.replace(ONE_LETTER, '$1$2\u00a0').replace(ONE_LETTER, '$1$2\u00a0');

function Mark({ on, multi }: { on: boolean; multi: boolean }) {
  return (
    <span className={`${s.mark} ${multi ? s.markSquare : ''} ${on ? s.markOn : ''}`} aria-hidden>
      <svg viewBox="0 0 16 16" width="12" height="12">
        <path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

/** Single and multiple choice. A "something else" option opens a short text field under it. */
function Choices({
  q,
  value,
  onPick,
  other,
  onOther,
}: {
  q: Question;
  value: AnswerValue | undefined;
  onPick: (v: AnswerValue) => void;
  other: string;
  onOther: (text: string) => void;
}) {
  if (q.kind === 'matrix' || q.kind === 'rank') return null;
  const multi = q.kind === 'multi';
  const picked = multi ? (Array.isArray(value) ? value : []) : typeof value === 'string' ? [value] : [];
  const isExclusive = (v: string) => Boolean(q.options.find((o) => o.value === v)?.exclusive);
  const full = multi && q.max ? picked.filter((v) => !isExclusive(v)).length >= q.max : false;
  const toggle = (o: Option) => {
    if (!multi) return onPick(o.value);
    if (picked.includes(o.value)) return onPick(picked.filter((v) => v !== o.value));
    if (o.exclusive) return onPick([o.value]);
    onPick([...picked.filter((v) => !isExclusive(v)), o.value]);
  };
  return (
    <div className={`${s.options} ${q.grid ? s.grid : ''}`} role={multi ? 'group' : 'radiogroup'} aria-label={q.title}>
      {q.options.map((o) => {
        const on = picked.includes(o.value);
        return (
          <Fragment key={o.value}>
            <button
              type="button"
              role={multi ? undefined : 'radio'}
              aria-checked={multi ? undefined : on}
              aria-pressed={multi ? on : undefined}
              disabled={full && !on && !o.exclusive}
              className={`${s.option} ${on ? s.optionOn : ''} ${o.exclusive && !q.grid ? s.optionLast : ''}`}
              onClick={() => toggle(o)}
            >
              <Mark on={on} multi={multi} />
              <span>{cz(o.label)}</span>
            </button>
            {o.other && on && (
              <input
                className={`${s.input} ${s.otherInput}`}
                value={other}
                maxLength={200}
                placeholder={o.other}
                aria-label={`${o.label}: ${o.other}`}
                onChange={(e) => onOther(e.target.value)}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

/** Tap order is the rank; tapping again takes the item out and the rest move up. */
function Rank({
  q,
  value,
  onChange,
  checked,
  onCheck,
}: {
  q: RankQuestion;
  value: AnswerValue | undefined;
  onChange: (v: string[]) => void;
  checked: boolean;
  onCheck: (on: boolean) => void;
}) {
  const order = Array.isArray(value) ? value : [];
  return (
    <>
      <div className={s.options} role="group" aria-label={q.title}>
        {q.options.map((o) => {
          const pos = order.indexOf(o.value);
          const on = pos > -1;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              aria-label={on ? `${o.label}, ${pos + 1}. místo` : o.label}
              className={`${s.option} ${on ? s.optionOn : ''}`}
              onClick={() => onChange(on ? order.filter((v) => v !== o.value) : [...order, o.value])}
            >
              <span className={`${s.rankNum} ${on ? s.rankNumOn : ''}`} aria-hidden>
                {on ? pos + 1 : ''}
              </span>
              <span>{cz(o.label)}</span>
            </button>
          );
        })}
      </div>
      {q.check && (
        <label className={s.check}>
          <input type="checkbox" checked={checked} onChange={(e) => onCheck(e.target.checked)} />
          <span>{cz(q.check.label)}</span>
        </label>
      )}
    </>
  );
}

export default function Anketa({ src, logoSrc }: { src: string; logoSrc: string | null }) {
  const [answers, setAnswers] = useState<Answers>({});
  const [open, setOpen] = useState<Open>({});
  const [contact, setContact] = useState<Contact>(NO_CONTACT);
  // How many items of this person's path are on the page: 0 = still on the intro.
  const [reached, setReached] = useState(0);
  const [startedAt, setStartedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ contact: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  // Optional OPPO newsletter, offered after the last question.
  const [newsletterStep, setNewsletterStep] = useState(false);
  const [wantsNewsletter, setWantsNewsletter] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const newsletterBlock = useRef<HTMLElement>(null);
  const blocks = useRef<(HTMLElement | null)[]>([]);
  const honeypot = useRef<HTMLInputElement>(null);
  const scrollTo = useRef<number | null>(null);
  const reachedRef = useRef(0);
  const answersRef = useRef<Answers>({});

  const setReachedTo = (n: number) => {
    reachedRef.current = n;
    setReached(n);
  };

  useEffect(() => {
    const finished = store.get<{ contact: boolean } | true>(DONE_KEY);
    if (finished) setDone(finished === true ? { contact: false } : finished);
    else {
      const d = store.get<Draft>(DRAFT_KEY);
      if (d?.answers) {
        answersRef.current = d.answers;
        setAnswers(d.answers);
        setOpen(d.open || {});
        setReachedTo(Math.min(anketaFlow(d.answers).length, Math.max(0, d.reached || 0)));
        setStartedAt(d.startedAt || 0);
        setNewsletterStep(d.newsletterStep === true);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || done) return;
    if (Object.keys(answers).length) store.set(DRAFT_KEY, { answers, open, reached, startedAt, newsletterStep } satisfies Draft);
  }, [ready, done, answers, open, reached, startedAt, newsletterStep]);

  useEffect(() => {
    if (!newsletterStep) return;
    newsletterBlock.current?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
    newsletterBlock.current?.focus({ preventScroll: true });
  }, [newsletterStep]);

  // Bring a newly revealed question into view once it has rendered.
  useEffect(() => {
    const i = scrollTo.current;
    if (i === null) return;
    scrollTo.current = null;
    const el = blocks.current[i];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - Math.min(96, window.innerHeight * 0.12);
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [reached]);

  const flow = anketaFlow(answers);

  const reveal = (count: number) => {
    const n = Math.min(count, anketaFlow(answersRef.current).length);
    if (n <= reachedRef.current) return;
    scrollTo.current = n - 1;
    setReachedTo(n);
  };

  const answer = (q: Question, v: AnswerValue, i: number) => {
    const next = { ...answersRef.current, [q.id]: v };
    // A different branch: questions below that no longer apply close, the new ones open one by one.
    const changedAt = firstDiff(anketaFlow(answersRef.current), anketaFlow(next));
    answersRef.current = next;
    setAnswers(next);
    setError('');
    if (changedAt < reachedRef.current) {
      setReachedTo(changedAt);
      setNewsletterStep(false);
    }
    // Single choice moves on by itself, except when the meeting answer opens the contact fields.
    if (q.kind === 'single' && !(q.id === 'meet' && wantsContact(v))) setTimeout(() => reveal(i + 2), reducedMotion() ? 0 : 260);
  };

  const setCheck = (id: string, on: boolean) => {
    const next = { ...answersRef.current, [id]: on ? 'ano' : 'ne' };
    answersRef.current = next;
    setAnswers(next);
  };

  const start = () => {
    if (!startedAt) setStartedAt(Date.now());
    if (reachedRef.current === 0) reveal(1);
    else blocks.current[0]?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' });
  };

  const questionIds = flow.filter((id) => BY_ID.has(id));
  const answeredCount = questionIds.filter((id) => isAnswered(BY_ID.get(id)!, answers[id])).length;
  const pathLength = anketaLength(answers);
  const total = pathLength - 1; // the closing message is optional
  const contactType = contactKind(contact.value);
  const contactReady =
    answers.meet === 'ano'
      ? Boolean(contactType && contact.consent)
      : answers.meet === 'mozna'
        ? !contact.value.trim() || Boolean(contactType && contact.consent)
        : true;
  const allAnswered = questionIds.every((id) => isAnswered(BY_ID.get(id)!, answers[id])) && contactReady;

  const newsletterReady = !cleanAnketaContact({ newsletter: true, email, consent }).error;

  const openNewsletter = () => {
    // A meeting e-mail is the likely newsletter address too; the person can still change it.
    if (!email && contactType === 'email') setEmail(contact.value.trim());
    setNewsletterStep(true);
  };

  async function submit(newsletter: boolean) {
    if (busy || !allAnswered) return;
    if (!newsletter) {
      setWantsNewsletter(false);
      setConsent(false);
    }
    setBusy(true);
    setError('');
    // Send only what belongs to this person's path.
    const sentAnswers: Answers = {};
    const sentOpen: Open = {};
    for (const id of questionIds) {
      const q = BY_ID.get(id)!;
      if (answers[id] !== undefined) sentAnswers[id] = answers[id];
      if (q.kind === 'rank' && q.check) sentAnswers[q.check.id] = answers[q.check.id] ?? 'ne';
      if (open[otherKey(id)]) sentOpen[otherKey(id)] = open[otherKey(id)];
    }
    if (open[MESSAGE.id]?.trim()) sentOpen[MESSAGE.id] = open[MESSAGE.id];
    const withContact = wantsContact(answers.meet) && Boolean(contact.value.trim());
    const res = await submitAnketa({
      answers: sentAnswers,
      open: sentOpen,
      ...(withContact ? { meetContact: contact.value, meetName: contact.name, meetConsent: contact.consent } : {}),
      newsletter,
      email: newsletter ? email : '',
      consent: newsletter && consent,
      src,
      startedAt,
      website: honeypot.current?.value || '',
    }).catch(() => ({ ok: false as const, error: 'Spojení se přerušilo. Zkuste to prosím znovu.' }));
    setBusy(false);
    if (!res.ok) return setError(res.error);
    store.remove(DRAFT_KEY);
    store.set(DONE_KEY, { contact: withContact });
    setDone({ contact: withContact });
    window.scrollTo({ top: 0 });
  }

  const nextButton = (i: number, enabled: boolean) => (
    <div className={s.actions}>
      <button type="button" className={s.secondary} disabled={!enabled} onClick={() => reveal(i + 2)}>
        Další otázka
      </button>
    </div>
  );

  return (
    <div className={s.root} data-anketa>
      <div className={s.progress} aria-hidden>
        <span style={{ width: `${done ? 100 : total ? Math.min(100, (answeredCount / total) * 100) : 0}%` }} />
      </div>

      <div className={s.page}>
        <header className={s.top}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logoSrc ? <img className={s.logo} src={logoSrc} alt="OPPO" /> : <b>OPPO</b>}
        </header>

        {done ? (
          <section className={s.thanks}>
            <h1 className={s.h1}>{ANKETA_TEXT.thanksTitle}</h1>
            <p className={s.lead}>{cz(ANKETA_TEXT.thanks)}</p>
            {done.contact && <p className={s.time}>{cz(ANKETA_TEXT.thanksContact)}</p>}
          </section>
        ) : (
          <>
            <section className={s.hero}>
              <div className={s.heroTitle}>
                <h1 className={s.h1}>{cz(ANKETA_TEXT.title)}</h1>
                <p className={s.lead}>{cz(ANKETA_TEXT.intro)}</p>
              </div>
              <div className={s.heroFigure}>
                <FormatCompare note={cz(ANKETA_TEXT.formatNote)} />
              </div>
              <div className={s.heroStart}>
                <p className={s.time}>{cz(ANKETA_TEXT.time)}</p>
                <div className={s.actions}>
                  <button type="button" className={s.primary} onClick={start}>
                    {ANKETA_TEXT.start}
                    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden>
                      <path d="M4 10h11m-4-4.5L15.5 10 11 14.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </section>

            <ol className={s.list}>
              {flow.slice(0, reached).map((id, i) => {
                const current = reached === i + 1;
                const setRef = (el: HTMLElement | null) => {
                  blocks.current[i] = el;
                };

                if (id === MESSAGE.id) {
                  return (
                    <li key={id} ref={setRef} className={`${s.block} ${s.reveal}`}>
                      <div className={s.qHead}>
                        <span className={s.num} aria-label={`Otázka ${i + 1} z ${pathLength}`}>{i + 1}/{pathLength}</span>
                        <div>
                          <h2 className={s.qTitle}>
                            <label htmlFor="anketa-message">{cz(MESSAGE.label)}</label>
                          </h2>
                          <p className={s.help}>Nepovinné.</p>
                        </div>
                      </div>
                      <textarea
                        id="anketa-message"
                        className={`${s.input} ${s.textarea}`}
                        maxLength={1000}
                        placeholder={MESSAGE.placeholder}
                        value={open[MESSAGE.id] || ''}
                        onChange={(e) => setOpen((o) => ({ ...o, [MESSAGE.id]: e.target.value }))}
                      />
                      {!newsletterStep && (
                        <div className={s.actions}>
                          <button type="button" className={s.primary} disabled={!allAnswered} onClick={openNewsletter}>
                            Pokračovat
                          </button>
                          {!allAnswered && <span className={s.note}>Chybí odpověď u některé otázky výše.</span>}
                        </div>
                      )}
                    </li>
                  );
                }

                const q = BY_ID.get(id)!;
                const value = answers[id];
                const ok = isAnswered(q, value);
                const picked = Array.isArray(value) ? value.length : 0;
                const full = q.kind === 'multi' && q.max && picked >= q.max;
                return (
                  <li key={id} ref={setRef} className={`${s.block} ${s.reveal}`}>
                    <div className={s.qHead}>
                      <span className={s.num} aria-label={`Otázka ${i + 1} z ${pathLength}`}>{i + 1}/{pathLength}</span>
                      <div>
                        <h2 className={s.qTitle}>{cz(q.title)}</h2>
                        {q.lead && <p className={s.qLead}>{cz(q.lead)}</p>}
                        {q.help && (
                          <p className={s.help} aria-live="polite">
                            {full ? `Máte vybrané ${picked} z ${q.max}. Pro jinou volbu nejdřív některou odznačte.` : cz(q.help)}
                          </p>
                        )}
                      </div>
                    </div>

                    {q.kind === 'rank' ? (
                      <Rank
                        q={q}
                        value={value}
                        onChange={(v) => answer(q, v, i)}
                        checked={q.check ? answers[q.check.id] === 'ano' : false}
                        onCheck={(on) => q.check && setCheck(q.check.id, on)}
                      />
                    ) : (
                      <Choices
                        q={q}
                        value={value}
                        onPick={(v) => answer(q, v, i)}
                        other={open[otherKey(id)] || ''}
                        onOther={(text) => setOpen((o) => ({ ...o, [otherKey(id)]: text }))}
                      />
                    )}

                    {id === 'meet' && wantsContact(value) && (
                      <div className={s.contact}>
                        <label className={s.field}>
                          <span className={s.fieldLabel}>Telefon nebo e-mail{value === 'mozna' ? ' (nepovinné)' : ''}</span>
                          <input
                            className={s.input}
                            value={contact.value}
                            maxLength={120}
                            autoComplete="email"
                            placeholder="777 123 456 nebo vas@email.cz"
                            onChange={(e) => setContact((c) => ({ ...c, value: e.target.value }))}
                          />
                          <span className={s.fieldHint}>
                            {value === 'ano' ? 'Ozveme se vám s termínem a místem.' : 'Když ho vyplníte, dáme vám vědět, až budeme znát termín.'}
                          </span>
                        </label>
                        <label className={s.field}>
                          <span className={s.fieldLabel}>Jméno (nepovinné)</span>
                          <input
                            className={s.input}
                            value={contact.name}
                            maxLength={80}
                            autoComplete="name"
                            onChange={(e) => setContact((c) => ({ ...c, name: e.target.value }))}
                          />
                        </label>
                        {contact.value.trim().length >= 6 && !contactType && (
                          <p className={s.note}>Takhle to nevypadá jako telefon ani e-mail. Zkontrolujte to prosím.</p>
                        )}
                        {contact.value.trim() && (
                          <label className={s.consent}>
                            <input type="checkbox" checked={contact.consent} onChange={(e) => setContact((c) => ({ ...c, consent: e.target.checked }))} />
                            <span>
                              {cz(ANKETA_TEXT.consent)}{' '}
                              <a href="/ochrana-osobnich-udaju#dotaznik" target="_blank" rel="noopener">
                                Ochrana osobních údajů
                              </a>
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    {current && (q.kind === 'multi' || q.kind === 'rank') && nextButton(i, ok)}
                    {current && id === 'meet' && wantsContact(value) && nextButton(i, contactReady)}
                  </li>
                );
              })}
            </ol>

            {newsletterStep && (
              <section ref={newsletterBlock} tabIndex={-1} aria-labelledby="newsletter-title" className={`${s.block} ${s.newsletter} ${s.reveal}`}>
                <p className={s.optional}>Zcela nepovinné</p>
                <h2 id="newsletter-title" className={s.qTitle}>{cz('Chcete být s OPPO v obraze?')}</h2>
                <p className={s.qLead}>
                  {cz('Občas vám pošleme novinky o telefonech OPPO, tipy a pozvánky. Pokud o ně nestojíte, anketu jednoduše dokončete bez e-mailu.')}
                </p>
                <div className={s.actions}>
                  <button
                    type="button"
                    className={wantsNewsletter ? s.primaryGhost : s.secondary}
                    disabled={busy}
                    aria-expanded={wantsNewsletter}
                    aria-controls="newsletter-form"
                    onClick={() => {
                      setWantsNewsletter(true);
                      setError('');
                    }}
                  >
                    Ano, chci novinky
                  </button>
                  <button type="button" className={s.secondary} disabled={busy || !allAnswered} onClick={() => submit(false)}>
                    {busy && !wantsNewsletter ? 'Odesílám…' : 'Ne, děkuji, dokončit anketu'}
                  </button>
                </div>
                {wantsNewsletter && (
                  <form
                    id="newsletter-form"
                    className={s.newsletterForm}
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (newsletterReady) void submit(true);
                    }}
                  >
                    <label className={s.field}>
                      <span className={s.fieldLabel}>E-mail pro novinky</span>
                      <input
                        className={s.input}
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={120}
                        required
                        value={email}
                        placeholder="vas@email.cz"
                        disabled={busy}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                      />
                    </label>
                    <label className={s.consent}>
                      <input
                        type="checkbox"
                        required
                        checked={consent}
                        disabled={busy}
                        onChange={(e) => {
                          setConsent(e.target.checked);
                          setError('');
                        }}
                      />
                      <span>
                        {cz(ANKETA_CONSENT_TEXT)}{' '}
                        <a href="/ochrana-osobnich-udaju#novinky" target="_blank" rel="noopener noreferrer">
                          Ochrana osobních údajů
                        </a>
                      </span>
                    </label>
                    <div className={s.actions}>
                      <button type="submit" className={s.primary} disabled={busy || !allAnswered || !newsletterReady}>
                        {busy ? 'Odesílám…' : 'Odeslat a přihlásit k novinkám'}
                      </button>
                    </div>
                  </form>
                )}
                {!allAnswered && <p className={s.note}>Nejdřív prosím doplňte odpověď u otázky výše.</p>}
                {error && <p className={s.error} role="alert">{error}</p>}
              </section>
            )}
          </>
        )}
      </div>
      <input ref={honeypot} className={s.hp} tabIndex={-1} autoComplete="off" aria-hidden name="website" />
    </div>
  );
}
