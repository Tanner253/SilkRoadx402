/**
 * Fixed-window rate limiting in MongoDB.
 *
 * Each check is ONE atomic update (an aggregation-pipeline upsert that either
 * starts a new window or increments the current one), so parallel requests
 * can't all read the same count and slip past the limit. Expired windows are
 * cleaned up by a TTL index.
 */

import mongoose from 'mongoose';
import { connectDB } from './db';

interface RateLimitEntry {
  key: string;
  count: number;
  resetAt: Date;
}

const RateLimitSchema = new mongoose.Schema<RateLimitEntry>({
  key: { type: String, required: true, unique: true },
  count: { type: Number, required: true },
  resetAt: { type: Date, required: true },
});
RateLimitSchema.index({ resetAt: 1 }, { expireAfterSeconds: 0 });

const RateLimit =
  (mongoose.models.RateLimit as mongoose.Model<RateLimitEntry>) ||
  mongoose.model<RateLimitEntry>('RateLimit', RateLimitSchema);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  /** Prefix that namespaces the key, e.g. 'create-fundraiser'. */
  keyPrefix: string;
  message?: string;
  /**
   * If the limiter itself fails (database down), deny instead of allow.
   * Use for security-sensitive endpoints like admin login.
   */
  failClosed?: boolean;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  message?: string;
}

export async function checkRateLimit(identifier: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const now = new Date();
  const freshReset = new Date(now.getTime() + config.windowMs);
  const deny = (resetAt: Date): RateLimitResult => ({
    allowed: false,
    remaining: 0,
    resetAt,
    message: config.message || 'Too many requests. Please try again later.',
  });

  try {
    await connectDB();
    const expired = { $lt: [{ $ifNull: ['$resetAt', new Date(0)] }, now] };
    const entry = await RateLimit.findOneAndUpdate(
      { key: `${config.keyPrefix}:${identifier}` },
      [
        {
          $set: {
            count: { $cond: [expired, 1, { $add: [{ $ifNull: ['$count', 0] }, 1] }] },
            resetAt: { $cond: [expired, freshReset, '$resetAt'] },
          },
        },
      ],
      { upsert: true, new: true },
    ).lean<RateLimitEntry>();

    if (!entry) return { allowed: true, remaining: config.maxRequests - 1, resetAt: freshReset };
    if (entry.count > config.maxRequests) return deny(entry.resetAt);
    return { allowed: true, remaining: config.maxRequests - entry.count, resetAt: entry.resetAt };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return config.failClosed ? deny(freshReset) : { allowed: true, remaining: config.maxRequests, resetAt: freshReset };
  }
}

export const RATE_LIMITS = {
  CREATE_FUNDRAISER: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,
    keyPrefix: 'create-fundraiser',
    message: 'You can start up to 3 campaigns an hour. Please try again later.',
  },
  IMAGE_UPLOAD: {
    maxRequests: 10,
    windowMs: 10 * 60 * 1000,
    keyPrefix: 'image-upload',
    message: 'Too many uploads. Please wait a few minutes and try again.',
  },
  COIN_IMPORT: {
    maxRequests: 10,
    windowMs: 10 * 60 * 1000,
    keyPrefix: 'coin-import',
    message: 'Too many coin lookups. Please wait a few minutes and try again.',
  },
} satisfies Record<string, RateLimitConfig>;
