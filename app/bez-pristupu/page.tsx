import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { getUser, isAdminEmail } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Bez přístupu', robots: { index: false, follow: false } };

export default async function NoAccessPage() {
  const user = await getUser();
  if (!user) redirect('/prihlaseni?next=/admin');
  if (isAdminEmail(user.email)) redirect('/admin');

  return (
    <section className="section">
      <div className="container" style={{ maxWidth: 720 }}>
        <h1 className="h2">Tenhle e-mail nemá přístup do administrace</h1>
        <p className="lead" style={{ marginTop: 20 }}>
          Jsi přihlášený jako <strong>{user.email}</strong>. Do administrace smí jen e-maily uvedené v proměnné ADMIN_EMAILS ve
          Vercelu (víc adres odděl čárkou). Po její úpravě je potřeba dát Redeploy.
        </p>
        <form action="/odhlasit" method="post" style={{ marginTop: 28 }}>
          <button type="submit" className="btn btn-black">Odhlásit a přihlásit jiným e-mailem</button>
        </form>
      </div>
    </section>
  );
}
