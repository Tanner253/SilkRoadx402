/**
 * Manage links — how a creator controls their campaign without a wallet
 * connection or an account.
 *
 * On creation we mint a random token, hand it back once inside a private
 * "manage link", and store only its SHA-256 hash. Presenting the token later
 * (x-manage-token header) proves ownership for edit / pause / delete. Losing
 * the link means losing edit access, same as losing a password with no
 * recovery — the campaign itself keeps running and keeps receiving funds.
 */

import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const MANAGE_TOKEN_HEADER = 'x-manage-token';

export function createManageToken(): { token: string; hash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, hash: hashManageToken(token) };
}

export function hashManageToken(token: string): string {
  return createHash('sha256').update(token, 'utf8').digest('hex');
}

/** Constant-time check of a presented token against the stored hash. */
export function manageTokenMatches(token: string | null | undefined, storedHash: string | null | undefined): boolean {
  if (!token || !storedHash) return false;
  const presented = Buffer.from(hashManageToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return presented.length === stored.length && timingSafeEqual(presented, stored);
}

export function manageTokenFrom(req: NextRequest): string | null {
  return req.headers.get(MANAGE_TOKEN_HEADER);
}
