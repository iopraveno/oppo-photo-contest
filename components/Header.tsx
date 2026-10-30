import Link from 'next/link';
import { getUser, isAdminEmail } from '@/lib/auth';

export default async function Header() {
  const user = await getUser();
  return (
    <header className="header">
      <div className="wrap header-inner">
        <Link href="/" className="brand" aria-label="Lovci světla, úvod">
          <span className="brand-oppo">OPPO</span>
          <span className="brand-name">Lovci světla</span>
        </Link>
        <nav className="nav" aria-label="Hlavní navigace">
          <Link href="/galerie">Galerie</Link>
          <Link href="/zebricek" className="nav-wide">Žebříček</Link>
          <Link href="/pravidla" className="nav-wide">Pravidla</Link>
          {user && isAdminEmail(user.email) && <Link href="/admin">Admin</Link>}
          {user ? (
            <form action="/odhlasit" method="post">
              <button type="submit" title={user.email}>Odhlásit</button>
            </form>
          ) : (
            <Link href="/prihlaseni" className="nav-cta">Hlasovat</Link>
          )}
        </nav>
      </div>
    </header>
  );
}
