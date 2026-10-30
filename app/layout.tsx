import type { Metadata, Viewport } from 'next';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CONTEST, SITE_URL } from '@/lib/config';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${CONTEST.name} · OPPO Photo Contest`, template: `%s · ${CONTEST.name}` },
  description: 'Vyfoť zimní světlo, sdílej ho na Instagramu a nech komunitu rozhodnout. Hraje se o OPPO Find X10.',
  openGraph: {
    title: `${CONTEST.name} · OPPO Photo Contest`,
    description: 'Vyfoť zimní světlo, sdílej ho na Instagramu a nech komunitu rozhodnout.',
    locale: 'cs_CZ',
    type: 'website',
  },
};

// Every page shows the visitor's sign-in state, so nothing is prerendered.
export const dynamic = 'force-dynamic';

export const viewport: Viewport = { themeColor: '#131a2a', width: 'device-width', initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="cs">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
