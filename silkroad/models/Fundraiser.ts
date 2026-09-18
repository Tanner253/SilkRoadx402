/**
 * A fundraising campaign. Collection and field names are kept from the
 * original schema so existing documents keep working.
 */

import mongoose, { Schema } from 'mongoose';
import type { IFundraiser } from '@/types/database';
import { FUNDRAISER_CATEGORIES } from '@/config/constants';
import { MAX_LINKS } from '@/lib/links';

const LinkSchema = new Schema(
  {
    url: { type: String, required: true, maxlength: 2048 },
    label: { type: String, maxlength: 60 },
  },
  { _id: false },
);

const FundraiserSchema = new Schema<IFundraiser>(
  {
    wallet: { type: String, required: true, index: true },
    title: { type: String, required: true, minlength: 5, maxlength: 100 },
    description: { type: String, required: true, minlength: 50, maxlength: 2000 },
    imageUrl: { type: String, required: true },
    category: { type: String, required: true, enum: FUNDRAISER_CATEGORIES },
    goalAmount: { type: Number, required: true, min: 0 },
    price: { type: Number, required: true, min: 0 },
    raisedAmount: { type: Number, default: 0, min: 0 },
    links: {
      type: [LinkSchema],
      default: [],
      validate: { validator: (v: unknown[]) => v.length <= MAX_LINKS, message: `At most ${MAX_LINKS} links` },
    },
    demoVideoUrl: { type: String },
    whitepaperUrl: { type: String },
    githubUrl: { type: String },
    network: { type: String, enum: ['solana', 'robinhood'], default: 'solana' },
    currency: { type: String, enum: ['USDC', 'ETH'], default: 'USDC' },
    manageTokenHash: { type: String, select: false },
    riskLevel: { type: String, enum: ['standard', 'high-risk'], default: 'standard' },
    state: { type: String, enum: ['in_review', 'on_market', 'pulled'], default: 'on_market', index: true },
    approved: { type: Boolean, default: true },
    pinned: { type: Boolean, default: false, index: true },
    pinnedAt: { type: Date },
    reportsCount: { type: Number, default: 0 },
    views: { type: Number, default: 0 },
  },
  { timestamps: true },
);

FundraiserSchema.index({ state: 1, createdAt: -1 });

export const Fundraiser =
  mongoose.models.Fundraiser || mongoose.model<IFundraiser>('Fundraiser', FundraiserSchema);
export default Fundraiser;
