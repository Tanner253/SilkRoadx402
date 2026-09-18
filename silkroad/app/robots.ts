import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  const site = siteUrl();
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/fundraisers/my'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
