'use client';

import { useActionState, useState } from 'react';
import Script from 'next/script';
import { sendCode, verifyCode, type LoginState } from './actions';

export default function LoginForm({ next, turnstileKey }: { next: string; turnstileKey: string }) {
  const [sent, sendAction, sending] = useActionState<LoginState, FormData>(sendCode, { step: 'email' });
  const [verified, verifyAction, verifying] = useActionState<LoginState, FormData>(verifyCode, { step: 'code' });
  const [changeEmail, setChangeEmail] = useState(false);

  const showCode = sent.step === 'code' && !changeEmail;

  if (showCode) {
    return (
      <form action={verifyAction} className="form">
        {sent.info && <p className="alert alert-ok">{sent.info}</p>}
        <input type="hidden" name="email" value={sent.email} />
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="code">Kód z e-mailu</label>
          <input
            id="code"
            name="code"
            className="input"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9 ]*"
            maxLength={12}
            required
            autoFocus
          />
        </div>
        {verified.error && <p className="alert alert-err">{verified.error}</p>}
        <button type="submit" className="btn btn-primary" disabled={verifying}>
          {verifying ? 'Ověřuji…' : 'Přihlásit a hlasovat'}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => setChangeEmail(true)}>
          Změnit e-mail nebo poslat kód znovu
        </button>
      </form>
    );
  }

  return (
    <form action={(fd) => { setChangeEmail(false); sendAction(fd); }} className="form">
      {turnstileKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <div className="field">
        <label htmlFor="email">Tvůj e-mail</label>
        <input
          id="email"
          name="email"
          type="email"
          className="input"
          autoComplete="email"
          defaultValue={sent.email}
          required
          autoFocus
        />
      </div>
      {turnstileKey && <div className="cf-turnstile" data-sitekey={turnstileKey} data-language="cs" />}
      {sent.error && <p className="alert alert-err">{sent.error}</p>}
      <button type="submit" className="btn btn-primary" disabled={sending}>
        {sending ? 'Posílám…' : 'Poslat přihlašovací kód'}
      </button>
      <p className="small muted">Žádné heslo. Pošleme ti jednorázový kód, který opíšeš sem.</p>
    </form>
  );
}
