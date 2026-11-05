'use client';

import { startTransition, useActionState, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { signUp, type SignupState } from './actions';

type Props = { brands: readonly string[]; otherBrand: string; turnstileKey: string; waitlist: boolean; deadline: string };

const MODEL_HINT: Record<string, string> = { OPPO: 'např. Find X10 Pro Max', OnePlus: 'např. OnePlus 13' };

export default function SignupForm({ brands, otherBrand, turnstileKey, waitlist, deadline }: Props) {
  const [state, action, pending] = useActionState<SignupState, FormData>(signUp, { status: 'idle' });
  const [brand, setBrand] = useState<string>(brands[0]);
  const other = brand === otherBrand;

  if (state.status === 'done') {
    return (
      <div className="pw-done" role="status">
        <span className="pw-done-mark" aria-hidden />
        <h3>{state.waitlist ? 'Jste mezi náhradníky' : 'Přihláška je u nás'}</h3>
        <p>
          Shrnutí jsme poslali na <strong>{state.email}</strong>.{' '}
          {state.waitlist
            ? 'Všechna místa jsou teď obsazená. Kdyby se některé uvolnilo, ozveme se e-mailem.'
            : 'Teď přihlášku projdeme a místo vám potvrdíme dalším e-mailem. Až se to stane, zaplní se i váš čtvereček.'}
        </p>
        <p className="small muted">Nic nepřišlo? Mrkněte do spamu nebo do složky Hromadné.</p>
      </div>
    );
  }

  const v = state.values;
  return (
    <form
      className="form pw-form"
      noValidate
      onSubmit={(e) => {
        // Submitting by hand keeps what was typed when the server sends back an error (a form action would reset the fields).
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        startTransition(() => action(data));
      }}
    >
      {turnstileKey && <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer />}
      <h3 className="pw-form-title">{waitlist ? 'Přihlásit se jako náhradník' : 'Přihláška'}</h3>
      <div className="field">
        <label htmlFor="pw-name">Jméno a příjmení</label>
        <input id="pw-name" name="name" className="input" autoComplete="name" defaultValue={v?.name} required />
      </div>
      <div className="field">
        <label htmlFor="pw-email">E-mail</label>
        <input id="pw-email" name="email" type="email" className="input" autoComplete="email" inputMode="email" defaultValue={v?.email} required />
      </div>
      <div className="field">
        <label htmlFor="pw-phone">Telefonní číslo</label>
        <input id="pw-phone" name="phone" type="tel" className="input" autoComplete="tel" inputMode="tel" placeholder="777 123 456" defaultValue={v?.phone} required />
      </div>
      <fieldset className="field pw-brand">
        <legend>Jaký máte telefon</legend>
        <div className="pw-brand-options">
          {brands.map((b) => (
            <label key={b} className="pw-brand-option">
              <input type="radio" name="brand" value={b} checked={brand === b} onChange={() => setBrand(b)} required />
              <span>{b}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="field">
        <label htmlFor="pw-model">{other ? 'Značka a model' : 'Model'}</label>
        <input
          id="pw-model"
          name="model"
          className="input"
          placeholder={other ? 'např. iPhone 16 Pro nebo Galaxy S25' : MODEL_HINT[brand] ?? ''}
          defaultValue={v?.model}
          required
        />
      </div>
      {/* Honeypot: hidden from people, bots fill it in. */}
      <div className="pw-hp" aria-hidden="true">
        <label htmlFor="pw-website">Web</label>
        <input id="pw-website" name="website" tabIndex={-1} autoComplete="off" />
      </div>
      <label className="checkbox pw-consent">
        <input type="checkbox" name="consent" required />
        <span>
          Souhlasím se zpracováním údajů pro organizaci akce a beru na vědomí, že se na akci bude fotit a natáčet.{' '}
          <Link href="/ochrana-osobnich-udaju#photowalk" target="_blank">Ochrana osobních údajů</Link>
        </span>
      </label>
      {turnstileKey && <div className="cf-turnstile" data-sitekey={turnstileKey} data-language="cs" />}
      {state.error && <p className="alert alert-err">{state.error}</p>}
      <button type="submit" className="btn btn-black" disabled={pending}>
        {pending ? 'Odesílám…' : waitlist ? 'Zapsat se mezi náhradníky' : 'Odeslat přihlášku'}
      </button>
      <p className="small muted">Přihlášky bereme do {deadline}, účast je zdarma.</p>
    </form>
  );
}
