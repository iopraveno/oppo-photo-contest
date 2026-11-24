'use client';

import { useEffect, useRef, useState } from 'react';
import { isAnswered, type Answers, type AnswerValue, type Option, type Question, type RankQuestion } from '@/lib/survey';
import { ANKETA, ANKETA_TEXT, MESSAGE, anketaFlow, anketaLength, isMeetEmail, otherKey } from '@/lib/survey-anketa';
import { ANKETA_CONSENT_TEXT, cleanAnketaContact } from '@/lib/anketa-contact';
import { submitAnketa } from './actions';
import FormatCompare from './FormatCompare';
import s from './anketa.module.css';

// Questions open one below another as people answer, and the page slides down to each new one.
// A different answer to a branching question closes what no longer applies and opens the new branch.
const DRAFT_KEY = `oppo-anketa-${ANKETA.slug}`;
const DONE_KEY = `${DRAFT_KEY}-hotovo`;

type Open = Record<string, string>;
type Meet = { email: string; name: string; consent: boolean };
// Contact details and consents stay in memory only, never in the browser draft.
type Draft = { answers: Answers; open: Open; reached: number; startedAt: number };

const NO_MEET: Meet = { email: '', name: '', consent: false };
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
const wantsMeeting = (meet: AnswerValue | undefined) => meet === 'ano' || meet === 'mozna';
const firstDiff = (a: string[], b: string[]) => {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
};

/** Czech typesetting: a one-letter word (v, s, k, a, i…) never ends a line, it is glued to the next word. */
const ONE_LETTER = /(^|[\s(])([aikosuvzAIKOSUVZ]) /g;
const cz = (text: string) => text.replace(ONE_LETTER, '$1$2 ').replace(ONE_LETTER, '$1$2 ');

/** Single and multiple choice with real radio buttons and check boxes. "Something else" opens a text field. */
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
    <div className={`${s.options} ${q.grid ? s.twoCol : ''}`} role={multi ? 'group' : 'radiogroup'} aria-label={q.title}>
      {q.options.map((o) => {
        const on = picked.includes(o.value);
        const disabled = full && !on && !o.exclusive;
        return (
          <label key={o.value} className={`${s.option} ${on ? s.optionOn : ''} ${disabled ? s.optionDisabled : ''}`}>
            <input type={multi ? 'checkbox' : 'radio'} name={q.id} checked={on} disabled={disabled} onChange={() => toggle(o)} />
            <span className={s.optText}>
              {cz(o.label)}
              {o.other && on && (
                <input
                  className={s.otherInput}
                  value={other}
                  maxLength={200}
                  placeholder={o.other}
                  aria-label={`${o.label}: ${o.other}`}
                  onChange={(e) => onOther(e.target.value)}
                />
              )}
            </span>
          </label>
        );
      })}
    </div>
  );
}

/** Click order is the rank; clicking again takes the item out and the rest move up. */
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
      <div className={s.rankList} role="group" aria-label={q.title}>
        {q.options.map((o) => {
          const pos = order.indexOf(o.value);
          const on = pos > -1;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={on}
              aria-label={on ? `${o.label}, ${pos + 1}. místo` : o.label}
              className={`${s.rankItem} ${on ? s.rankSelected : ''}`}
              onClick={() => onChange(on ? order.filter((v) => v !== o.value) : [...order, o.value])}
            >
              <span className={s.rankNum} aria-hidden>{on ? pos + 1 : ''}</span>
              <span className={s.rankText}>{cz(o.label)}</span>
            </button>
          );
        })}
      </div>
      {q.check && (
        <label className={s.standaloneCheck}>
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
  const [meet, setMeet] = useState<Meet>(NO_MEET);
  const [newsletter, setNewsletter] = useState(false);
  const [email, setEmail] = useState('');
  const [consent, setConsent] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [missing, setMissing] = useState<string | null>(null);
  const [done, setDone] = useState<{ contact: boolean } | null>(null);
  const [ready, setReady] = useState(false);
  // How many items of this person's path are open; the first question is open from the start.
  const [reached, setReached] = useState(1);
  const reachedRef = useRef(1);
  const answersRef = useRef<Answers>({});
  const scrollTo = useRef<number | null>(null);
  const blocks = useRef<Record<string, HTMLElement | null>>({});
  const honeypot = useRef<HTMLInputElement>(null);

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
        setReachedTo(Math.min(anketaFlow(d.answers).length, Math.max(1, d.reached || 1)));
        setStartedAt(d.startedAt || 0);
      }
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || done) return;
    if (Object.keys(answers).length) store.set(DRAFT_KEY, { answers, open, reached, startedAt } satisfies Draft);
  }, [ready, done, answers, open, reached, startedAt]);

  // Slide down to a newly opened question once it has rendered.
  useEffect(() => {
    const i = scrollTo.current;
    if (i === null) return;
    scrollTo.current = null;
    const el = blocks.current[anketaFlow(answersRef.current)[i]];
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - Math.min(96, window.innerHeight * 0.12);
    window.scrollTo({ top, behavior: reducedMotion() ? 'auto' : 'smooth' });
  }, [reached]);

  const flow = anketaFlow(answers);
  const questionIds = flow.filter((id) => BY_ID.has(id));
  const pathLength = anketaLength(answers);
  const answeredCount = questionIds.filter((id) => isAnswered(BY_ID.get(id)!, answers[id])).length;
  const visible = flow.slice(0, reached);
  // Everything is open: both branching questions answered and the closing message reached.
  const finished = flow.includes(MESSAGE.id) && reached >= flow.length;

  const meetEmailOk = isMeetEmail(meet.email);
  const meetReady =
    answers.meet === 'ano' ? meetEmailOk && meet.consent : answers.meet === 'mozna' ? !meet.email.trim() || (meetEmailOk && meet.consent) : true;
  const newsletterError = newsletter ? cleanAnketaContact({ newsletter: true, email, consent }).error : undefined;
  // A question marked as missing turns back to normal as soon as it is complete.
  const complete = (id: string) =>
    id === 'newsletter' ? !newsletterError : id === 'meet' ? isAnswered(BY_ID.get(id)!, answers[id]) && meetReady : !BY_ID.has(id) || isAnswered(BY_ID.get(id)!, answers[id]);
  const flagged = (id: string) => missing === id && !complete(id);

  const reveal = (count: number) => {
    const n = Math.min(count, anketaFlow(answersRef.current).length);
    if (n <= reachedRef.current) return;
    scrollTo.current = n - 1;
    setReachedTo(n);
  };

  const answer = (q: Question, v: AnswerValue, i: number) => {
    if (!startedAt) setStartedAt(Date.now());
    const next = { ...answersRef.current, [q.id]: v };
    // A different branch: questions below that no longer apply close, the new ones open one by one.
    const changedAt = firstDiff(anketaFlow(answersRef.current), anketaFlow(next));
    answersRef.current = next;
    setAnswers(next);
    setError('');
    if (changedAt < reachedRef.current) setReachedTo(changedAt);
    // Single choice moves on by itself, except when the meeting answer opens the e-mail field.
    if (q.kind === 'single' && !(q.id === 'meet' && wantsMeeting(v))) setTimeout(() => reveal(i + 2), reducedMotion() ? 0 : 280);
  };

  const setCheck = (id: string, on: boolean) => {
    const next = { ...answersRef.current, [id]: on ? 'ano' : 'ne' };
    answersRef.current = next;
    setAnswers(next);
  };

  const toggleNewsletter = (on: boolean) => {
    setNewsletter(on);
    setError('');
    // The meeting e-mail is the likely newsletter address too; the person can still change it.
    if (on && !email && meetEmailOk) setEmail(meet.email.trim());
  };

  const jumpTo = (id: string, message: string) => {
    setMissing(id);
    setError(message);
    blocks.current[id]?.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'center' });
  };

  async function submit() {
    if (busy) return;
    // The first unanswered question on this person's path, top to bottom.
    const gap = questionIds.findIndex((id) => !isAnswered(BY_ID.get(id)!, answers[id]));
    if (gap > -1) return jumpTo(questionIds[gap], `Chybí odpověď u otázky ${flow.indexOf(questionIds[gap]) + 1}.`);
    if (!finished) return;
    if (!meetReady) {
      return jumpTo(
        'meet',
        meet.email.trim() && !meetEmailOk
          ? 'Zkontrolujte prosím e-mail u otázky na setkání.'
          : 'U otázky na setkání chybí e-mail nebo souhlas s kontaktováním.',
      );
    }
    if (newsletterError) return jumpTo('newsletter', newsletterError);

    setBusy(true);
    setError('');
    setMissing(null);
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
    const withContact = wantsMeeting(answers.meet) && Boolean(meet.email.trim());
    const res = await submitAnketa({
      answers: sentAnswers,
      open: sentOpen,
      ...(withContact ? { meetContact: meet.email, meetName: meet.name, meetConsent: meet.consent } : {}),
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

  const logo = logoSrc ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className={s.logo} src={logoSrc} alt="OPPO" />
  ) : (
    <b className={s.logo}>OPPO</b>
  );

  return (
    <div className={s.root} data-anketa>
      <div className={s.progress} aria-hidden>
        <span style={{ width: `${done ? 100 : pathLength > 1 ? Math.min(100, (answeredCount / (pathLength - 1)) * 100) : 0}%` }} />
      </div>

      <main className={s.container}>
        {done ? (
          <div className={s.surveyHeader}>
            {logo}
            <h1 className={s.h1}>{ANKETA_TEXT.thanksTitle}</h1>
            <p className={s.intro}>
              {cz(ANKETA_TEXT.thanks)}
              {done.contact && ` ${cz(ANKETA_TEXT.thanksContact)}`}
            </p>
          </div>
        ) : (
          <>
            <header className={s.surveyHeader}>
              {logo}
              <h1 className={s.h1}>{cz(ANKETA_TEXT.title)}</h1>
              <p className={s.intro}>{cz(ANKETA_TEXT.intro)}</p>
            </header>

            <FormatCompare />

            {visible.map((id, i) => {
              const current = reached === i + 1;
              const ref = (el: HTMLElement | null) => {
                blocks.current[id] = el;
              };
              const number = <span className={s.qNumber}>{i + 1}.</span>;

              if (id === MESSAGE.id) {
                return (
                  <section key={id} ref={ref} className={`${s.questionBlock} ${s.reveal}`}>
                    <div className={s.qHeader}>
                      {number}
                      <h2 className={s.qText}>
                        <label htmlFor="anketa-message">{cz(MESSAGE.label)}</label>
                      </h2>
                    </div>
                    <div className={s.indent}>
                      <textarea
                        id="anketa-message"
                        className={s.textarea}
                        maxLength={1000}
                        placeholder={MESSAGE.placeholder}
                        value={open[MESSAGE.id] || ''}
                        onChange={(e) => setOpen((o) => ({ ...o, [MESSAGE.id]: e.target.value }))}
                      />
                    </div>
                  </section>
                );
              }

              const q = BY_ID.get(id)!;
              const value = answers[id];
              const picked = Array.isArray(value) ? value.length : 0;
              const full = q.kind === 'multi' && q.max && picked >= q.max;
              return (
                <section key={id} ref={ref} className={`${s.questionBlock} ${s.reveal} ${flagged(id) ? s.questionMissing : ''}`}>
                  <div className={s.qHeader}>
                    {number}
                    <h2 className={s.qText}>{cz(q.title)}</h2>
                  </div>
                  {q.lead && <p className={s.qLead}>{cz(q.lead)}</p>}
                  {q.help && (
                    <p className={s.qHint} aria-live="polite">
                      {full ? `Máte vybrané ${picked} z ${q.max}. Pro jinou volbu nejdřív některou odznačte.` : cz(q.help)}
                    </p>
                  )}

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

                  {id === 'meet' && wantsMeeting(value) && (
                    <div className={s.contactFields}>
                      <div>
                        <label htmlFor="meet-email">E-mail{value === 'mozna' ? ' (nepovinné)' : ''}</label>
                        <input
                          id="meet-email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          maxLength={120}
                          placeholder="vas@email.cz"
                          value={meet.email}
                          onChange={(e) => setMeet((m) => ({ ...m, email: e.target.value }))}
                        />
                        {value === 'mozna' && <p className={s.fieldHint}>Když ho vyplníte, dáme vám vědět, až budeme znát termín.</p>}
                      </div>
                      <div>
                        <label htmlFor="meet-name">Jméno (nepovinné)</label>
                        <input
                          id="meet-name"
                          autoComplete="name"
                          maxLength={80}
                          placeholder="Vaše jméno"
                          value={meet.name}
                          onChange={(e) => setMeet((m) => ({ ...m, name: e.target.value }))}
                        />
                      </div>
                      {meet.email.trim().length >= 5 && !meetEmailOk && <p className={s.fieldError}>Takhle e-mail nevypadá, zkontrolujte ho prosím.</p>}
                      {meet.email.trim() && (
                        <label className={s.consent}>
                          <input type="checkbox" checked={meet.consent} onChange={(e) => setMeet((m) => ({ ...m, consent: e.target.checked }))} />
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

                  {current && (q.kind === 'multi' || q.kind === 'rank' || (id === 'meet' && wantsMeeting(value))) && (
                    <div className={s.nextRow}>
                      <button
                        type="button"
                        className={s.nextBtn}
                        disabled={id === 'meet' ? !meetReady : !isAnswered(q, value)}
                        onClick={() => reveal(i + 2)}
                      >
                        Další otázka
                      </button>
                    </div>
                  )}
                </section>
              );
            })}

            {finished && (
              <section
                ref={(el) => {
                  blocks.current.newsletter = el;
                }}
                className={`${s.questionBlock} ${s.reveal} ${flagged('newsletter') ? s.questionMissing : ''}`}
                aria-labelledby="newsletter-title"
              >
                <div className={s.qHeader}>
                  <span className={s.qNumber} aria-hidden />
                  <h2 id="newsletter-title" className={s.qText}>{cz('Chcete být s OPPO v obraze?')}</h2>
                </div>
                <div className={s.options}>
                  <label className={`${s.option} ${newsletter ? s.optionOn : ''}`}>
                    <input type="checkbox" checked={newsletter} onChange={(e) => toggleNewsletter(e.target.checked)} />
                    <span className={s.optText}>{cz('Ano, občas mi pošlete novinky o telefonech OPPO, tipy a pozvánky')}</span>
                  </label>
                </div>
                {newsletter && (
                  <div className={s.contactFields}>
                    <div>
                      <label htmlFor="newsletter-email">E-mail pro novinky</label>
                      <input
                        id="newsletter-email"
                        type="email"
                        inputMode="email"
                        autoComplete="email"
                        maxLength={120}
                        placeholder="vas@email.cz"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                      />
                    </div>
                    <label className={s.consent}>
                      <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                      <span>
                        {cz(ANKETA_CONSENT_TEXT)}{' '}
                        <a href="/ochrana-osobnich-udaju#novinky" target="_blank" rel="noopener noreferrer">
                          Ochrana osobních údajů
                        </a>
                      </span>
                    </label>
                  </div>
                )}
              </section>
            )}

            {finished && (
              <footer className={`${s.surveyFooter} ${s.reveal}`}>
                <button type="button" className={s.submitBtn} disabled={busy} onClick={submit}>
                  {busy ? 'Odesílám…' : ANKETA_TEXT.submit}
                </button>
                {error && !(missing && complete(missing)) && (
                  <p className={s.error} role="alert">
                    {error}
                  </p>
                )}
              </footer>
            )}
          </>
        )}
      </main>
      <input ref={honeypot} className={s.hp} tabIndex={-1} autoComplete="off" aria-hidden name="website" />
    </div>
  );
}
