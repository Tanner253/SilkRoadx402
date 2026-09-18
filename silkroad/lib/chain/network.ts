/**
 * Robinhood Chain constants and pure helpers — safe to import in the browser.
 * Server-side verification lives in ./robinhood.ts.
 *
 * Robinhood Chain is NOT Ethereum mainnet: it is its own EVM chain (id 4663)
 * whose native currency happens to be ETH.
 */

import { defineChain, getAddress, isAddress, isHash, type Hash } from 'viem';

export const ROBINHOOD_CHAIN_ID = 4663;
export const ROBINHOOD_RPC_URL =
  process.env.ROBINHOOD_RPC_URL || 'https://rpc.mainnet.chain.robinhood.com';
export const ROBINHOOD_CHAIN_NAME = 'Robinhood Chain';
export const ROBINHOOD_EXPLORER_URL = 'https://robinhoodchain.blockscout.com';

export const robinhoodChain = defineChain({
  id: ROBINHOOD_CHAIN_ID,
  name: 'Robinhood Chain',
  nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
  rpcUrls: { default: { http: [ROBINHOOD_RPC_URL] } },
  blockExplorers: { default: { name: 'Blockscout', url: ROBINHOOD_EXPLORER_URL } },
});

/** Checksummed address, or null if it isn't a valid EVM address. */
export function normalizeAddress(value: unknown): `0x${string}` | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return isAddress(trimmed, { strict: false }) ? getAddress(trimmed) : null;
}

/** Lower-cased tx hash, or null if it isn't a 32-byte hex hash. */
export function normalizeTxHash(value: unknown): Hash | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim().toLowerCase();
  return isHash(trimmed) ? (trimmed as Hash) : null;
}

export const explorerTxUrl = (hash: string) => `${ROBINHOOD_EXPLORER_URL}/tx/${hash}`;
export const explorerAddressUrl = (address: string) => `${ROBINHOOD_EXPLORER_URL}/address/${address}`;

/** Explorer link for a donation, whichever chain it was made on. */
export function donationExplorerUrl(hash: string, network?: string) {
  return network === 'robinhood' ? explorerTxUrl(hash) : `https://solscan.io/tx/${hash}`;
}
