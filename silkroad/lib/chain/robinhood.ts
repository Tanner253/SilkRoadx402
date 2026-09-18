/**
 * Robinhood Chain — the network OpenFund donations run on.
 *
 * Robinhood Chain is NOT Ethereum mainnet: it's its own EVM chain (id 4663)
 * whose native currency happens to be ETH. Every check here pins that chain
 * id, so a transaction from any other network can never be credited.
 *
 * Why verification is by transaction hash: plain ETH transfers emit no event
 * logs, so the public RPC has no way to answer "find transfers from A to B",
 * and the chain's explorer (Blockscout) sits behind a Cloudflare challenge
 * that blocks server-side requests. A specific transaction, though, can be
 * fetched and checked directly — so the donor gives us its hash.
 *
 * Facts verified live against the RPC — see TB/MIGRATION-ROBINHOOD.md.
 */

import { createPublicClient, formatEther, getAddress, http, type Hash } from 'viem';
import { ROBINHOOD_CHAIN_ID, ROBINHOOD_RPC_URL, robinhoodChain } from './network';

export * from './network';

const client = createPublicClient({ chain: robinhoodChain, transport: http(ROBINHOOD_RPC_URL) });

export interface VerifiedDonation {
  hash: Hash;
  from: `0x${string}`;
  to: `0x${string}`;
  valueWei: bigint;
  /** ETH as a decimal string, exact. */
  valueEth: string;
  blockNumber: bigint;
  timestamp: Date;
}

export type VerifyFailure =
  | 'not_found'
  | 'pending'
  | 'failed'
  | 'wrong_chain'
  | 'wrong_recipient'
  | 'wrong_sender'
  | 'zero_value'
  | 'too_early';

export class DonationVerificationError extends Error {
  constructor(public reason: VerifyFailure, message: string) {
    super(message);
  }
}

interface VerifyOptions {
  hash: Hash;
  /** The campaign's receiving address. */
  recipient: `0x${string}`;
  /** If the donor told us their address, the tx must come from it. */
  sender?: `0x${string}` | null;
  /** Transfers mined before the campaign existed can't be donations to it. */
  notBefore: Date;
}

/**
 * Confirm `hash` is a successful, mined, direct ETH transfer on Robinhood
 * Chain from `sender` (if given) to `recipient`, made after `notBefore`.
 *
 * Only direct sends count: ETH forwarded by a contract (e.g. a smart-contract
 * wallet's internal call) shows the contract as `to`, and is rejected as
 * wrong_recipient rather than guessed at.
 */
export async function verifyDonationTx({
  hash,
  recipient,
  sender,
  notBefore,
}: VerifyOptions): Promise<VerifiedDonation> {
  const tx = await client.getTransaction({ hash }).catch(() => null);
  if (!tx) {
    throw new DonationVerificationError(
      'not_found',
      "We couldn't find that transaction on Robinhood Chain. Check the hash, and that you sent on Robinhood Chain rather than another network.",
    );
  }
  if (tx.blockNumber == null) {
    throw new DonationVerificationError('pending', 'That transaction is still pending. Try again in a few seconds.');
  }
  // Legacy pre-EIP-155 transactions carry no chain id; everything modern does.
  if (tx.chainId !== undefined && tx.chainId !== ROBINHOOD_CHAIN_ID) {
    throw new DonationVerificationError('wrong_chain', 'That transaction is not on Robinhood Chain.');
  }
  if (!tx.to || getAddress(tx.to) !== recipient) {
    throw new DonationVerificationError('wrong_recipient', "That transaction wasn't sent to this campaign's address.");
  }
  if (sender && getAddress(tx.from) !== sender) {
    throw new DonationVerificationError('wrong_sender', "That transaction wasn't sent from the address you entered.");
  }
  if (tx.value <= BigInt(0)) {
    throw new DonationVerificationError('zero_value', "That transaction didn't send any ETH.");
  }

  const [receipt, block] = await Promise.all([
    client.getTransactionReceipt({ hash }),
    client.getBlock({ blockNumber: tx.blockNumber }),
  ]);
  if (receipt.status !== 'success') {
    throw new DonationVerificationError('failed', 'That transaction failed on-chain, so no ETH was sent.');
  }

  const timestamp = new Date(Number(block.timestamp) * 1000);
  if (timestamp < notBefore) {
    throw new DonationVerificationError('too_early', 'That transaction happened before this campaign was created.');
  }

  return {
    hash,
    from: getAddress(tx.from),
    to: recipient,
    valueWei: tx.value,
    valueEth: formatEther(tx.value),
    blockNumber: tx.blockNumber,
    timestamp,
  };
}
