/**
 * A donor's declared intent to give: "I'll send to campaign X from wallet Y".
 *
 * Donations are only counted when they can be tied to a registered sender,
 * so this record is what the site checks against the chain. The cursor is
 * where the last check left off (see lib/chain/watch.ts).
 */

import mongoose, { Schema, type Document } from 'mongoose';

export type WatchStatus = 'watching' | 'found' | 'expired' | 'needs_archive';

export interface IDonationWatch extends Document {
  fundraiserId: string;
  donor: string;
  recipient: string;
  status: WatchStatus;
  /** Block/nonce the watch has verified up to. Stored as strings/numbers; blocks exceed 2^53 eventually. */
  cursorBlock: string;
  cursorNonce: number;
  /** Donations credited through this watch. */
  foundTxHashes: string[];
  lastCheckedAt?: Date;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const DonationWatchSchema = new Schema<IDonationWatch>(
  {
    fundraiserId: { type: String, required: true, index: true },
    donor: { type: String, required: true, index: true },
    recipient: { type: String, required: true },
    status: { type: String, enum: ['watching', 'found', 'expired', 'needs_archive'], default: 'watching', index: true },
    cursorBlock: { type: String, required: true },
    cursorNonce: { type: Number, required: true },
    foundTxHashes: { type: [String], default: [] },
    lastCheckedAt: { type: Date },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

DonationWatchSchema.index({ fundraiserId: 1, donor: 1, status: 1 });

export const DonationWatch =
  mongoose.models.DonationWatch || mongoose.model<IDonationWatch>('DonationWatch', DonationWatchSchema);
export default DonationWatch;
