/**
 * Admin sessions.
 *
 * Login checks ADMIN_CODE, then sets an httpOnly cookie holding a signed,
 * expiring token: base64url(payload) + "." + HMAC-SHA256(payload, secret).
 * Every admin request re-verifies the signature and expiry, so the cookie
 * can't be forged or edited by hand (the old cookie was the literal string
 * "active", which anyone could set).
 *
 * Fails closed: in production, admin login is disabled entirely unless both
 * ADMIN_CODE and JWT_SECRET are set to real, non-default values.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const ADMIN_COOKIE = 'openfund_admin';
export const ADMIN_SESSION_SECONDS = 8 * 60 * 60;

const INSECURE_DEFAULTS = new Set(['', 'admin123', 'dev-secret-change-in-production']);

function secret(): string | null {
  const value = process.env.JWT_SECRET ?? '';
  if (process.env.NODE_ENV === 'production' && (INSECURE_DEFAULTS.has(value) || value.length < 16)) return null;
  return value || 'dev-only-admin-secret';
}

function adminCode(): string | null {
  const value = process.env.ADMIN_CODE ?? '';
  if (process.env.NODE_ENV === 'production' && INSECURE_DEFAULTS.has(value)) return null;
  return value || 'admin123';
}

/** Whether admin login can work in this environment at all. */
export function adminConfigured(): boolean {
  return secret() !== null && adminCode() !== null;
}

function sign(data: string, key: string) {
  return createHmac('sha256', key).update(data).digest('base64url');
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Constant-time check of a submitted admin code. */
export function adminCodeMatches(submitted: unknown): boolean {
  const code = adminCode();
  return typeof submitted === 'string' && code !== null && safeEqual(submitted, code);
}

export function createAdminSession(): string | null {
  const key = secret();
  if (!key) return null;
  const payload = Buffer.from(JSON.stringify({ admin: true, exp: Math.floor(Date.now() / 1000) + ADMIN_SESSION_SECONDS })).toString('base64url');
  return `${payload}.${sign(payload, key)}`;
}

export function isAdminRequest(req: NextRequest): boolean {
  const key = secret();
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!key || !token) return false;

  const [payload, signature] = token.split('.');
  if (!payload || !signature || !safeEqual(signature, sign(payload, key))) return false;
  try {
    const { admin, exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return admin === true && typeof exp === 'number' && exp > Date.now() / 1000;
  } catch {
    return false;
  }
}
