import type { CampaignLink } from '@/lib/links';

/** A fundraiser as the API returns it (see lib/fundraiserTotals.presentFundraiser). */
export interface FundraiserView {
  _id: string;
  /** The campaign's receiving address. */
  wallet: string;
  title: string;
  description: string;
  imageUrl: string;
  category: string;
  goalAmount?: number;
  price?: number;
  raisedAmount?: number;
  donationCount?: number;
  network: 'solana' | 'robinhood';
  currency: 'USDC' | 'ETH';
  state: 'in_review' | 'on_market' | 'pulled';
  pinned?: boolean;
  views?: number;
  links: CampaignLink[];
  createdAt: string;
  updatedAt?: string;
}

export interface DonationView {
  _id: string;
  wallet: string;
  amount: number;
  createdAt: string;
  txnHash: string;
  network: 'solana' | 'robinhood';
  currency: 'USDC' | 'ETH';
}

export interface CommentView {
  _id: string;
  buyerWallet: string;
  comment: string;
  createdAt: string;
}

export const goalOf = (f: Pick<FundraiserView, 'goalAmount' | 'price'>) => f.goalAmount || f.price || 0;
