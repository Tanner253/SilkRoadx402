/**
 * Read a coin's public profile straight from its contract on Robinhood Chain.
 *
 * pons tokens (and tokens from launchers built the same way) are
 * self-describing: name, symbol, logo, description and socials are all
 * on-chain, so a campaign can be prefilled from nothing but the address.
 * Every field is optional — plain ERC-20s just return name and symbol.
 */

import { createPublicClient, http, parseAbi } from 'viem';
import { ROBINHOOD_EXPLORER_URL, ROBINHOOD_RPC_URL, robinhoodChain } from './network';
import { coerceUrl, type CampaignLink } from '@/lib/links';

const client = createPublicClient({ chain: robinhoodChain, transport: http(ROBINHOOD_RPC_URL, { retryCount: 1, timeout: 8_000 }) });

const abi = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function logo() view returns (string)',
  'function description() view returns (string)',
  'function socials() view returns (string twitter, string telegram, string discord, string website, string farcaster)',
]);

export interface CoinProfile {
  address: `0x${string}`;
  name: string;
  symbol: string;
  description: string;
  /** Where the logo can be fetched from, best first; empty if it has none. */
  logos: string[];
  links: CampaignLink[];
}

export class CoinNotFoundError extends Error {}

const clean = (value: unknown, max: number) =>
  typeof value === 'string' ? value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').trim().slice(0, max) : '';

/** Public IPFS gateways, tried in order — any one of them can be slow or rate-limited. */
const IPFS_GATEWAYS = ['https://gateway.pinata.cloud/ipfs/', 'https://4everland.io/ipfs/', 'https://ipfs.io/ipfs/'];

/**
 * Where a logo can be fetched from, best first: an ipfs:// logo gets one URL
 * per gateway; an https logo is used as-is; anything else is dropped.
 */
export function publicImageUrls(raw: string): string[] {
  const value = raw.trim();
  const ipfs = value.match(/^ipfs:\/\/(?:ipfs\/)?([A-Za-z0-9]+(?:\/[^\s?#]*)?)$/);
  if (ipfs) return IPFS_GATEWAYS.map((gateway) => gateway + ipfs[1]);
  try {
    const url = new URL(value);
    return url.protocol === 'https:' ? [url.toString()] : [];
  } catch {
    return [];
  }
}

/** Socials are stored as full URLs by some launchers and bare handles by others. */
function socialUrl(kind: 'twitter' | 'telegram' | 'discord' | 'website' | 'farcaster', raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (/^https?:\/\//i.test(value) || value.includes('.')) return coerceUrl(value);
  const handle = value.replace(/^@/, '');
  if (!/^[A-Za-z0-9_.-]{1,64}$/.test(handle)) return null;
  switch (kind) {
    case 'twitter':
      return `https://x.com/${handle}`;
    case 'telegram':
      return `https://t.me/${handle}`;
    case 'discord':
      return `https://discord.gg/${handle}`;
    case 'farcaster':
      return `https://farcaster.xyz/${handle}`;
    default:
      return null;
  }
}

export async function readCoin(address: `0x${string}`): Promise<CoinProfile> {
  const code = await client.getCode({ address });
  if (!code || code === '0x') throw new CoinNotFoundError('There’s no contract at that address on Robinhood Chain.');

  const read = <T>(functionName: 'name' | 'symbol' | 'logo' | 'description' | 'socials') =>
    client.readContract({ address, abi, functionName }).then((v) => v as T).catch(() => null);
  const [name, symbol, logo, description, socials] = await Promise.all([
    read<string>('name'),
    read<string>('symbol'),
    read<string>('logo'),
    read<string>('description'),
    read<readonly [string, string, string, string, string]>('socials'),
  ]);
  if (!name && !symbol) throw new CoinNotFoundError('That contract isn’t a token.');

  const links: CampaignLink[] = [];
  if (socials) {
    const kinds = ['twitter', 'telegram', 'discord', 'website', 'farcaster'] as const;
    kinds.forEach((kind, i) => {
      const url = socialUrl(kind, clean(socials[i], 300));
      if (url && !links.some((l) => l.url === url)) links.push({ url });
    });
  }
  const cleanSymbol = clean(symbol, 20);
  links.push({ url: `${ROBINHOOD_EXPLORER_URL}/token/${address}`, label: `${cleanSymbol ? `$${cleanSymbol}` : 'Coin'} contract` });

  return {
    address,
    name: clean(name, 100),
    symbol: cleanSymbol,
    description: clean(description, 2000),
    logos: logo ? publicImageUrls(clean(logo, 500)) : [],
    links,
  };
}
