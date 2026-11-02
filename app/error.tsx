'use client';

import { useEffect } from 'react';

// A form submitted from a page that was loaded before a new deployment points to code that no longer exists.
const isStaleDeployment = (message: string) => /server action|failed to fetch|chunk/i.test(message);

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
    if (!isStaleDeployment(error.message || '')) return;
    try {
      // Reload to pick up the current version of the site, at most once a minute so it never loops.
      const last = Number(sessionStorage.getItem('stale-reload') || 0);
      if (Date.now() - last < 60_000) return;
      sessionStorage.setItem('stale-reload', String(Date.now()));
      window.location.reload();
    } catch {
      // Storage unavailable: leave the manual button.
    }
  }, [error]);

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <span className="label">Chyba</span>
        <h1 className="h2" style={{ marginTop: 12 }}>Něco se pokazilo</h1>
        <p className="lead" style={{ marginTop: 16 }}>
          Stránku se nepodařilo načíst. Zkus ji prosím obnovit.
        </p>
        <p className="small muted" style={{ marginTop: 12 }}>
          {error.digest ? `Kód chyby: ${error.digest}` : error.message ? `Detail: ${error.message}` : null}
        </p>
        <p style={{ marginTop: 24 }}>
          <button
            type="button"
            className="btn btn-black"
            onClick={() => {
              try { sessionStorage.removeItem('stale-reload'); } catch {}
              window.location.reload();
            }}
          >
            Obnovit stránku
          </button>
        </p>
      </div>
    </section>
  );
}
