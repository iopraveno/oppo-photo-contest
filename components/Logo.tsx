import Link from 'next/link';
import { img } from '@/lib/images';

function find(base: string) {
  return img(`${base}.svg`) ?? img(`${base}.png`);
}

/** OPPO logo from public/img, with a typographic fallback until the file is added. */
export default function Logo({ variant = 'white', sub }: { variant?: 'white' | 'dark'; sub?: string }) {
  const src = find(variant === 'white' ? 'oppo-logo-white' : 'oppo-logo');
  return (
    <Link href="/" className="logo" aria-label="OPPO, úvodní stránka soutěže">
      {src ? <img src={src} alt="OPPO" /> : <span className="logo-word">OPPO</span>}
      {sub && <span className="logo-sub">{sub}</span>}
    </Link>
  );
}

export function BrandLogo({ brand, variant = 'white', height = 18 }: { brand: 'oppo' | 'oneplus'; variant?: 'white' | 'dark'; height?: number }) {
  const src = find(`${brand}-logo${variant === 'white' ? '-white' : ''}`);
  const name = brand === 'oppo' ? 'OPPO' : 'OnePlus';
  return src ? <img src={src} alt={name} style={{ height, width: 'auto' }} /> : <span className="logo-word" style={{ fontSize: height }}>{name}</span>;
}
