import Link from 'next/link';
import { CONTEST, instagramProfileUrl } from '@/lib/config';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer-inner">
        <p>
          {CONTEST.fullName} · <Link href="/galerie">Galerie</Link> · <Link href="/zebricek">Žebříček</Link> ·{' '}
          <Link href="/pravidla">Pravidla soutěže</Link> ·{' '}
          <a href={instagramProfileUrl(CONTEST.instagramHandle)} target="_blank" rel="noopener noreferrer">
            @{CONTEST.instagramHandle}
          </a>
        </p>
        <p>
          Tato soutěž není nijak sponzorována, podporována ani spravována společností Instagram ani s ní není nijak spojena.
        </p>
      </div>
    </footer>
  );
}
