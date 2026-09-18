/**
 * Raised totals, computed from recorded donations — the source of truth.
 * `raisedAmount` on the Fundraiser document is a running counter and can
 * drift; anything user-facing should use these numbers.
 */

import { Transaction } from '@/models/Transaction';
import { decodeEscaped } from '@/lib/validation/sanitization';
import { allLinks, type CampaignLink } from '@/lib/links';

export interface RaisedTotal {
  raised: number;
  donations: number;
}

/** One aggregate for any number of campaigns, instead of a query each. */
export async function raisedTotals(fundraiserIds: string[]): Promise<Map<string, RaisedTotal>> {
  const totals = new Map<string, RaisedTotal>();
  if (!fundraiserIds.length) return totals;

  const rows: { _id: string; raised: number; donations: number }[] = await Transaction.aggregate([
    { $match: { listingId: { $in: fundraiserIds }, status: 'success' } },
    { $group: { _id: '$listingId', raised: { $sum: '$amount' }, donations: { $sum: 1 } } },
  ]);
  for (const row of rows) totals.set(row._id, { raised: row.raised, donations: row.donations });
  return totals;
}

/** Fields never sent to the browser: secrets and retired legacy fields. */
const HIDDEN_FIELDS = [
  'deliveryUrl',
  'manageTokenHash',
  'failedPurchaseCount',
  'lastFailureAt',
  'demoVideoUrl',
  'whitepaperUrl',
  'githubUrl',
  '__v',
] as const;

type Presented<T> = Omit<T, (typeof HIDDEN_FIELDS)[number] | 'links' | 'title' | 'description' | 'network' | 'currency'> & {
  links: CampaignLink[];
  title: string;
  description: string;
  network: 'solana' | 'robinhood';
  currency: 'USDC' | 'ETH';
};

/**
 * Shape a fundraiser for the client: fill the chain defaults legacy documents
 * lack, decode text that older code stored HTML-escaped, fold legacy link
 * fields into `links`, and never leak secrets or retired fields.
 */
export function presentFundraiser<T extends object>(doc: T): Presented<T> {
  const source = doc as Record<string, unknown>;
  const out: Record<string, unknown> = { ...source };
  for (const key of HIDDEN_FIELDS) delete out[key];
  return {
    ...out,
    links: allLinks(source as Parameters<typeof allLinks>[0]),
    title: decodeEscaped(source.title as string),
    description: decodeEscaped(source.description as string),
    network: (source.network ?? 'solana') as 'solana' | 'robinhood',
    currency: (source.currency ?? 'USDC') as 'USDC' | 'ETH',
  } as Presented<T>;
}
