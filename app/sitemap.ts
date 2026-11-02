import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';
import { getEntries } from '@/lib/data';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries = await getEntries({ sort: 'new' });
  const latest = entries[0]?.created_at ? new Date(entries[0].created_at) : new Date();
  return [
    { url: `${SITE_URL}/`, lastModified: latest, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/galerie`, lastModified: latest, changeFrequency: 'hourly', priority: 0.9 },
    { url: `${SITE_URL}/zebricek`, lastModified: latest, changeFrequency: 'hourly', priority: 0.8 },
    { url: `${SITE_URL}/pravidla`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${SITE_URL}/ochrana-osobnich-udaju`, changeFrequency: 'yearly', priority: 0.2 },
    ...entries.map((e) => ({
      url: `${SITE_URL}/foto/${e.id}`,
      lastModified: new Date(e.created_at),
      changeFrequency: 'daily' as const,
      priority: 0.6,
    })),
  ];
}
