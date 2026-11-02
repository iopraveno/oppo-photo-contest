import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { TURNSTILE_SITE_KEY } from '@/lib/config';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Přihlášení', robots: { index: false } };

type Search = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/galerie';
  const user = await getUser();
  if (user) redirect(next);
  const forAdmin = next.startsWith('/admin');

  return (
    <section className="section">
      <div className="container login">
        <div>
          {forAdmin ? (
            <>
              <span className="label">Administrace</span>
              <h1 className="h2" style={{ marginTop: 12 }}>Přihlášení do administrace</h1>
              <p className="lead" style={{ marginTop: 20 }}>
                Zadej e-mail, který má přístup do administrace. Pošleme ti jednorázový kód a po jeho opsání se otevře správa soutěže.
              </p>
            </>
          ) : (
            <>
              <span className="label">Hlasování</span>
              <h1 className="h2" style={{ marginTop: 12 }}>Přihlas se e-mailem a hlasuj</h1>
              <p className="lead" style={{ marginTop: 20 }}>
                Hlasovat můžou jen lidé s ověřeným e-mailem, aby soutěž byla fér. Žádné heslo, pošleme ti jednorázový kód.
              </p>
              <p className="muted small" style={{ marginTop: 20 }}>
                Soutěžící se registrovat nemusí, stačí jim příspěvek na Instagramu. E-mail použijeme jen pro hlasování a po skončení
                soutěže ho smažeme. <Link href="/pravidla">Pravidla soutěže</Link>
              </p>
            </>
          )}
        </div>
        <LoginForm next={next} turnstileKey={TURNSTILE_SITE_KEY} />
      </div>
    </section>
  );
}
