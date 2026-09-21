/**
 * The public site URL, for link previews (og:url / og:image), the sitemap and
 * robots.txt.
 *
 * NEXT_PUBLIC_APP_URL wins when it's a real address. A localhost value is
 * ignored in production builds: a deploy built with a local .env once shipped
 * og:image = http://localhost:3000/…, which Telegram and X can't fetch, so
 * link previews lost their image.
 */

const PRODUCTION_URL = 'https://openfund.fun';

export function siteUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/+$/, '');
  if (!configured) return PRODUCTION_URL;
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/i.test(configured);
  if (isLocal && process.env.NODE_ENV === 'production') return PRODUCTION_URL;
  return configured;
}

/** One description used everywhere the site describes itself. */
export const SITE_TITLE = 'OpenFund — No-KYC charity on Robinhood Chain';
export const SITE_TAGLINE = 'Good things start with a little.';
export const SITE_DESCRIPTION =
  'No KYC. No wallet connection. Raise or give ETH on Robinhood Chain — every donation goes straight from the donor’s wallet to the cause. Powered by $OPENFUND on pons.';
