import Link from 'next/link';
import { CONTEST, instagramProfileUrl } from '@/lib/config';
import Logo from './Logo';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-top">
          <Logo />
          <div className="footer-links">
            <Link href="/galerie">Galerie</Link>
            <Link href="/zebricek">Žebříček</Link>
            <Link href="/#temata">Témata</Link>
            <Link href="/pravidla">Pravidla soutěže</Link>
            <a href={instagramProfileUrl(CONTEST.instagramHandle)} target="_blank" rel="noopener noreferrer">
              Instagram @{CONTEST.instagramHandle}
            </a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>{CONTEST.fullName} | {CONTEST.dateRangeLabel}</p>
          <p>
            Tato soutěž není nijak sponzorována, podporována ani spravována společností Instagram ani s ní není nijak spojena.
            Ukázkové fotografie byly pořízeny telefony OPPO Find X10 Series s fotoaparátem Hasselblad.
          </p>
        </div>
      </div>
    </footer>
  );
}
