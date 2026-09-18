/**
 * Mongoose document types.
 *
 * Collection and field names (listingId, buyerWallet, sellerWallet, price…)
 * are kept from the original schema so existing data keeps working.
 */

import type { Document, Types } from 'mongoose';
import type { LogType } from '@/lib/logger';

export type FundraiserState = 'in_review' | 'on_market' | 'pulled';
export type Network = 'solana' | 'robinhood';
export type Currency = 'USDC' | 'ETH';

export interface FundraiserLink {
  url: string;
  label?: string;
}

export interface IFundraiser extends Document {
  /** The campaign's receiving address. */
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  goalAmount?: number;
  /** Legacy mirror of goalAmount. */
  price: number;
  /** Running counter; user-facing totals are summed from Transactions. */
  raisedAmount?: number;
  links: FundraiserLink[];
  /** Legacy single-purpose links, shown alongside `links`. */
  demoVideoUrl?: string;
  whitepaperUrl?: string;
  githubUrl?: string;
  /** Legacy docs have none (= solana / USDC). */
  network?: Network;
  currency?: Currency;
  /** SHA-256 of the creator's manage-link token. Never selected by default. */
  manageTokenHash?: string;
  riskLevel: 'standard' | 'high-risk';
  state: FundraiserState;
  /** false after a moderator removes it; only an admin can restore. */
  approved: boolean;
  pinned: boolean;
  pinnedAt?: Date;
  reportsCount: number;
  views: number;
  createdAt: Date;
  updatedAt: Date;
}

/** A verified donation. */
export interface ITransaction extends Document {
  /** The fundraiser's id. */
  listingId: string;
  /** Donor address. */
  buyerWallet: string;
  /** Campaign receiving address. */
  sellerWallet: string;
  /** In `currency` units; a float, so amountWei is the exact value. */
  amount: number;
  txnHash: string;
  status: 'success' | 'failed';
  network?: Network;
  currency?: Currency;
  amountWei?: string;
  blockNumber?: number;
  createdAt: Date;
}

/** Plain object from `.lean()`: the fields without Document's methods. */
export type Lean<T> = Omit<T, keyof Document> & { _id: Types.ObjectId };
export type LeanFundraiser = Lean<IFundraiser>;
export type LeanTransaction = Lean<ITransaction>;

export interface IReport extends Document {
  listingId: string;
  /** Salted IP hash for anonymous reports (legacy: a wallet address). */
  reporterWallet: string;
  reason?: string;
  createdAt: Date;
}

export interface ILog extends Document {
  type: LogType;
  message: string;
  wallet?: string;
  ip?: string;
  createdAt: Date;
}
