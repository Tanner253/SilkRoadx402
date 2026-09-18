import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const site = process.env.NEXT_PUBLIC_APP_URL || 'https://openfund.fun';
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/api/', '/admin', '/fundraisers/my'] }],
    sitemap: `${site}/sitemap.xml`,
  };
}
