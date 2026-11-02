import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/config';

// Everyone may crawl the public pages, AI assistants included; private and technical routes stay out.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/prihlaseni', '/odhlasit', '/bez-pristupu'] }],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
