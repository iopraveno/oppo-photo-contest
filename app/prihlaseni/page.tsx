import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUser } from '@/lib/auth';
import { TURNSTILE_SITE_KEY } from '@/lib/config';
import LoginForm from './LoginForm';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Přihlášení' };

type Search = Promise<{ next?: string }>;

export default async function LoginPage({ searchParams }: { searchParams: Search }) {
  const { next: rawNext } = await searchParams;
  const next = rawNext && rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/galerie';
  const user = await getUser();
  if (user) redirect(next);

  return (
    <section className="section">
      <div className="wrap">
        <p className="eyebrow">Hlasování</p>
        <h1 className="section-title">Přihlas se e-mailem</h1>
        <p className="section-lead" style={{ marginBottom: 28 }}>
          Hlasovat můžou jen lidé s ověřeným e-mailem, aby soutěž byla fér. Soutěžící se registrovat nemusí, stačí jim příspěvek
          na Instagramu.
        </p>
        <LoginForm next={next} turnstileKey={TURNSTILE_SITE_KEY} />
        <p className="small muted" style={{ marginTop: 24, maxWidth: 520 }}>
          E-mail použijeme jen pro hlasování v soutěži a po jejím skončení ho smažeme. <Link href="/pravidla">Pravidla soutěže</Link>
        </p>
      </div>
    </section>
  );
}
