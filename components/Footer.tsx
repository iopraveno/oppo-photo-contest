import Link from 'next/link';
import { CONTEST, SOCIALS, ORGANIZER } from '@/lib/config';
import Logo from './Logo';

const icons: Record<string, React.ReactNode> = {
  Instagram: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
    </svg>
  ),
  Facebook: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.5-1.5h1.4V5c-.3 0-1.1-.1-2.1-.1-2.1 0-3.6 1.3-3.6 3.7V11H8.2v3h2.5v7h2.8z" />
    </svg>
  ),
  YouTube: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M22 8.2c-.2-1.2-1-2-2.1-2.2C18 5.7 12 5.7 12 5.7s-6 0-7.9.3C3 6.2 2.2 7 2 8.2 1.7 9.6 1.7 12 1.7 12s0 2.4.3 3.8c.2 1.2 1 2 2.1 2.2 1.9.3 7.9.3 7.9.3s6 0 7.9-.3c1.1-.2 1.9-1 2.1-2.2.3-1.4.3-3.8.3-3.8s0-2.4-.3-3.8zM10 15V9l5.2 3L10 15z" />
    </svg>
  ),
  TikTok: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden>
      <path d="M16.5 3c.3 2.2 1.6 3.6 3.8 3.8v3c-1.4 0-2.7-.4-3.8-1.2v6.6c0 3.5-2.8 5.8-5.8 5.8-3.1 0-5.7-2.5-5.7-5.7 0-3.5 3.1-6.2 6.7-5.6v3.1c-1.8-.5-3.6.8-3.6 2.5 0 1.5 1.2 2.6 2.6 2.6 1.6 0 2.7-1.2 2.7-2.9V3h3.1z" />
    </svg>
  ),
};

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
            <Link href="/ochrana-osobnich-udaju">Osobní údaje</Link>
          </div>
          <div className="footer-social">
            {SOCIALS.map((s) => (
              <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={`OPPO Česko na ${s.name}`} title={s.name}>
                {icons[s.name]}
              </a>
            ))}
          </div>
        </div>
        <div className="footer-bottom">
          <p>{CONTEST.fullName} | {CONTEST.dateRangeLabel} | Pořadatel: {ORGANIZER.name}, IČO {ORGANIZER.ico}</p>
          <p>
            Tato soutěž není nijak sponzorována, podporována ani spravována společností Instagram ani s ní není nijak spojena.
            Ukázkové fotografie byly pořízeny telefony OPPO Find X10 Series s fotoaparátem Hasselblad.
          </p>
        </div>
      </div>
    </footer>
  );
}
