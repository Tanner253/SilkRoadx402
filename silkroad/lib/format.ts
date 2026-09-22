/** Display formatting shared by the fundraiser pages. */

export type Currency = 'ETH' | 'USDC';

/** "0.0156 ETH" / "$12.40". ETH keeps enough precision for small gifts. */
export function formatAmount(value: number | undefined | null, currency: Currency = 'ETH'): string {
  const n = Number(value) || 0;
  if (currency === 'USDC') {
    return `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }
  if (n > 0 && n < 0.0001) return '<0.0001 ETH';
  const digits = n >= 100 ? 2 : n >= 1 ? 3 : 4;
  return `${n.toLocaleString(undefined, { maximumFractionDigits: digits })} ETH`;
}

/** 0x1234…abcd */
export function shortAddress(address: string | undefined | null, lead = 6, tail = 4): string {
  if (!address) return '';
  return address.length <= lead + tail + 1 ? address : `${address.slice(0, lead)}…${address.slice(-tail)}`;
}

export function percentRaised(raised: number | undefined, goal: number | undefined): number {
  if (!goal || goal <= 0) return 0;
  return Math.min(100, Math.max(0, ((raised || 0) / goal) * 100));
}

export function timeAgo(date: string | Date | undefined): string {
  if (!date) return '';
  const seconds = Math.max(0, (Date.now() - new Date(date).getTime()) / 1000);
  const steps: [number, string][] = [
    [60, 'second'], [60, 'minute'], [24, 'hour'], [30, 'day'], [12, 'month'], [Infinity, 'year'],
  ];
  let value = seconds;
  for (const [size, unit] of steps) {
    if (value < size) {
      const v = Math.floor(value);
      return v <= 0 && unit === 'second' ? 'just now' : `${v} ${unit}${v === 1 ? '' : 's'} ago`;
    }
    value /= size;
  }
  return '';
}

/**
 * A nudge for campaigns close to their goal — people are likelier to give
 * when their gift visibly finishes the job. Null when there's nothing to say.
 */
export function goalNudge(raised: number | undefined, goal: number | undefined, currency: Currency = 'ETH'): string | null {
  if (!goal || goal <= 0) return null;
  const have = raised || 0;
  if (have >= goal) return 'Goal reached — still open for gifts';
  if (have / goal >= 0.75) return `Only ${formatAmount(goal - have, currency)} to go`;
  return null;
}

/** Compact age for tight spaces: "now", "4m", "3h", "2d", "5mo", "1y". */
export function shortAgo(date: string | Date | undefined): string {
  if (!date) return '';
  const minutes = Math.max(0, (Date.now() - new Date(date).getTime()) / 60_000);
  if (minutes < 1) return 'now';
  if (minutes < 60) return `${Math.floor(minutes)}m`;
  if (minutes < 60 * 24) return `${Math.floor(minutes / 60)}h`;
  if (minutes < 60 * 24 * 30) return `${Math.floor(minutes / (60 * 24))}d`;
  if (minutes < 60 * 24 * 365) return `${Math.floor(minutes / (60 * 24 * 30))}mo`;
  return `${Math.floor(minutes / (60 * 24 * 365))}y`;
}
