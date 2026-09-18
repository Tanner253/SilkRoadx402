/**
 * POST /api/reports — report a campaign. Anonymous: the reporter is keyed by
 * a salted hash of their IP, giving one report per person per campaign (the
 * model's unique index) without storing raw IPs. 5 reports a day per IP.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'node:crypto';
import { isValidObjectId } from 'mongoose';
import { connectDB } from '@/lib/db';
import { Report } from '@/models/Report';
import { Fundraiser } from '@/models/Fundraiser';
import { checkRateLimit } from '@/lib/rateLimit';
import { createLog, getIpFromRequest } from '@/lib/logger';
import { plainText } from '@/lib/validation/sanitization';
import { isDuplicateKeyError } from '@/lib/errors';

const REPORT_LIMIT = {
  maxRequests: 5,
  windowMs: 24 * 60 * 60 * 1000,
  keyPrefix: 'report',
  message: 'You’ve sent the maximum number of reports for today.',
};

export async function POST(req: NextRequest) {
  try {
    const { listingId, reason } = await req.json().catch(() => ({}));
    if (!isValidObjectId(listingId)) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
    const text = typeof reason === 'string' ? plainText(reason).slice(0, 100) : '';

    await connectDB();
    const ip = getIpFromRequest(req) || 'unknown';
    const rate = await checkRateLimit(ip, REPORT_LIMIT);
    if (!rate.allowed) return NextResponse.json({ error: rate.message }, { status: 429 });

    const fundraiser = await Fundraiser.findById(listingId).select('title');
    if (!fundraiser) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });

    const reporter = 'ip:' + createHash('sha256').update(`${process.env.APP_SECRET ?? ''}:${ip}`).digest('hex').slice(0, 24);
    try {
      await Report.create({ listingId, reporterWallet: reporter, reason: text || undefined });
    } catch (err) {
      if (isDuplicateKeyError(err)) return NextResponse.json({ error: 'You’ve already reported this campaign.' }, { status: 409 });
      throw err;
    }
    await Fundraiser.updateOne({ _id: listingId }, { $inc: { reportsCount: 1 } });
    await createLog('report_submitted', `Campaign "${fundraiser.title}" reported${text ? `: ${text}` : ''}`, undefined, ip);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Report error:', error);
    return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
  }
}
