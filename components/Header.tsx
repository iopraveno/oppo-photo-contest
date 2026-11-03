import Link from 'next/link';
import { getUser, isAdminEmail, isPhotowalkAdminEmail } from '@/lib/auth';
import Logo from './Logo';
import HeaderShell from './HeaderShell';

export default async function Header() {
  const user = await getUser();
  return (
    <HeaderShell>
      <div className="container header-inner">
        <Logo />
        <nav className="nav" aria-label="Hlavní navigace">
          <Link href="/galerie">Galerie</Link>
          <Link href="/zebricek" className="nav-wide">Žebříček</Link>
          <Link href="/#temata" className="nav-wide">Témata</Link>
          <Link href="/pravidla" className="nav-wide">Pravidla</Link>
          {user && isAdminEmail(user.email) && <Link href="/admin">Admin</Link>}
          {user && !isAdminEmail(user.email) && isPhotowalkAdminEmail(user.email) && <Link href="/admin/photowalk">Photo walk</Link>}
          {user ? (
            <form action="/odhlasit" method="post">
              <button type="submit" title={user.email}>Odhlásit</button>
            </form>
          ) : (
            <Link href="/prihlaseni" className="nav-cta">Hlasovat</Link>
          )}
        </nav>
      </div>
    </HeaderShell>
  );
}
