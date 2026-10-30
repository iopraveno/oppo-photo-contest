'use client';

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 640 }}>
        <span className="label">Chyba</span>
        <h1 className="h2" style={{ marginTop: 12 }}>Něco se pokazilo</h1>
        <p className="lead" style={{ marginTop: 16 }}>
          Stránku se nepodařilo načíst. Zkus to prosím za chvíli znovu.
        </p>
        {error.digest && <p className="small muted" style={{ marginTop: 12 }}>Kód chyby: {error.digest}</p>}
        <p style={{ marginTop: 24 }}>
          <button type="button" className="btn btn-black" onClick={reset}>Zkusit znovu</button>
        </p>
      </div>
    </section>
  );
}
