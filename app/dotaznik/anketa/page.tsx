import type { Metadata, Viewport } from 'next';
import { img } from '@/lib/images';
import { cleanSource } from '@/lib/survey';
import { ANKETA_TEXT } from '@/lib/survey-anketa';
import Anketa from './Anketa';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: { absolute: `${ANKETA_TEXT.title} | OPPO` },
  description: ANKETA_TEXT.description,
  alternates: { canonical: '/dotaznik/anketa' },
  robots: { index: false, follow: true },
  openGraph: { type: 'website', locale: 'cs_CZ', siteName: 'OPPO Česko', title: ANKETA_TEXT.title, description: ANKETA_TEXT.description },
  twitter: { card: 'summary_large_image', title: ANKETA_TEXT.title, description: ANKETA_TEXT.description },
};

export const viewport: Viewport = { themeColor: '#f5f7f4' };

type Search = Promise<{ src?: string; utm_source?: string }>;

export default async function AnketaPage({ searchParams }: { searchParams: Search }) {
  const { src, utm_source } = await searchParams;
  return <Anketa src={cleanSource(src || utm_source)} logoSrc={img('oppo-logo.png')} />;
}
