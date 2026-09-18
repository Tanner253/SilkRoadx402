import { Log } from '@/models/Log';
import { connectDB } from './db';

export type LogType =
  | 'error'
  | 'admin_action'
  | 'admin_fail'
  | 'fundraiser_created'
  | 'fundraiser_updated'
  | 'fundraiser_deleted'
  | 'fundraiser_donated'
  | 'donation_watch'
  | 'report_submitted';

/** Append an audit log entry. Never throws — logging must not break a request. */
export async function createLog(type: LogType, message: string, wallet?: string, ip?: string): Promise<void> {
  try {
    await connectDB();
    await Log.create({ type, message, wallet: wallet || undefined, ip: ip || undefined });
  } catch (error) {
    console.error('Failed to write log:', error);
  }
}

/** Client IP as reported by the platform's proxy (Vercel sets x-forwarded-for). */
export function getIpFromRequest(req: Request): string | undefined {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return req.headers.get('x-real-ip') ?? undefined;
}
