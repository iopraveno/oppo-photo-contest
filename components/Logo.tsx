import Link from 'next/link';
import { img } from '@/lib/images';

/** OPPO logo from public/img, with a typographic fallback until the SVG is added. */
export default function Logo({ variant = 'white', sub }: { variant?: 'white' | 'dark'; sub?: string }) {
  const src = img(variant === 'white' ? 'oppo-logo-white.svg' : 'oppo-logo.svg');
  return (
    <Link href="/" className="logo" aria-label="OPPO, úvodní stránka soutěže">
      {src ? <img src={src} alt="OPPO" /> : <span className="logo-word">OPPO</span>}
      {sub && <span className="logo-sub">{sub}</span>}
    </Link>
  );
}
