/**
 * GET /api/health — for uptime monitors. Reports whether the database and the
 * Robinhood Chain RPC are reachable. 200 when both are, 503 otherwise.
 */

import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { headBlock } from '@/lib/chain/watch';

export const dynamic = 'force-dynamic';

async function timed<T>(fn: () => Promise<T>) {
  const start = Date.now();
  try {
    const value = await fn();
    return { ok: true, ms: Date.now() - start, value };
  } catch (error) {
    return { ok: false, ms: Date.now() - start, error: error instanceof Error ? error.message : 'failed' };
  }
}

export async function GET() {
  const [db, chain] = await Promise.all([
    timed(async () => {
      await connectDB();
      await mongoose.connection.db!.admin().ping();
      return 'up';
    }),
    timed(async () => (await headBlock()).toString()),
  ]);
  const ok = db.ok && chain.ok;
  return NextResponse.json(
    {
      ok,
      database: { ok: db.ok, ms: db.ms },
      chain: { ok: chain.ok, ms: chain.ms, head: chain.ok ? chain.value : undefined },
    },
    { status: ok ? 200 : 503, headers: { 'cache-control': 'no-store' } },
  );
}
