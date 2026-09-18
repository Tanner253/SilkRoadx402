/**
 * Admin session.
 *   POST   { code }  → log in; sets the signed httpOnly session cookie
 *   GET              → { admin: boolean } for the current request
 *   DELETE           → log out
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { checkRateLimit } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_SECONDS,
  adminCodeMatches,
  adminConfigured,
  createAdminSession,
  isAdminRequest,
} from '@/lib/adminAuth';

// Counts every attempt, so guessing the code is slow no matter what.
const LOGIN_LIMIT = {
  maxRequests: 5,
  windowMs: 15 * 60 * 1000,
  keyPrefix: 'admin-login',
  message: 'Too many login attempts. Try again in 15 minutes.',
  failClosed: true,
};

export async function GET(req: NextRequest) {
  return NextResponse.json({ admin: isAdminRequest(req), configured: adminConfigured() });
}

export async function POST(req: NextRequest) {
  if (!adminConfigured()) {
    return NextResponse.json({ error: 'Admin login is disabled: ADMIN_CODE and JWT_SECRET must be set.' }, { status: 503 });
  }

  const ip = getIpFromRequest(req) || 'unknown';
  await connectDB();
  const rate = await checkRateLimit(ip, LOGIN_LIMIT);
  if (!rate.allowed) return NextResponse.json({ error: rate.message }, { status: 429 });

  const { code } = await req.json().catch(() => ({}));
  if (!adminCodeMatches(code)) {
    await createLog('admin_fail', 'Failed admin login attempt', undefined, ip);
    return NextResponse.json({ error: 'Invalid admin code' }, { status: 401 });
  }

  const token = createAdminSession();
  if (!token) return NextResponse.json({ error: 'Admin login is disabled.' }, { status: 503 });

  await createLog('admin_action', 'Admin logged in', undefined, ip);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: ADMIN_SESSION_SECONDS,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
