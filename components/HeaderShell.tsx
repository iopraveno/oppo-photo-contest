'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/** Header chrome: transparent over the home hero, solid once the page scrolls or on other pages. */
export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const overHero = pathname === '/';
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return <header className={`header${overHero ? ' header-over' : ''}${scrolled ? ' header-solid' : ''}`}>{children}</header>;
}
