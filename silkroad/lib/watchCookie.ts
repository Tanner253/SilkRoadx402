/**
 * The browser's list of donation watches, kept in an httpOnly cookie so the
 * reminder banner follows the donor across pages and visits. Holds only watch
 * ids; everything else is read from the database.
 */

import { isValidObjectId } from 'mongoose';
import type { NextRequest, NextResponse } from 'next/server';

export const WATCH_COOKIE = 'openfund_watches';
const MAX_WATCHES = 8;
const MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

export function watchIdsFrom(req: NextRequest): string[] {
  const raw = req.cookies.get(WATCH_COOKIE)?.value ?? '';
  return raw.split('.').filter(isValidObjectId).slice(-MAX_WATCHES);
}

export function setWatchIds(res: NextResponse, ids: string[]) {
  const unique = Array.from(new Set(ids)).slice(-MAX_WATCHES);
  res.cookies.set(WATCH_COOKIE, unique.join('.'), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: unique.length ? MAX_AGE_SECONDS : 0,
  });
}
