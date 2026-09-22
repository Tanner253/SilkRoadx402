/**
 * POST /api/upload/image — upload a campaign cover to Cloudinary.
 * multipart/form-data with an `image` field: JPEG, PNG or WebP, up to 5 MB.
 */

import { NextRequest, NextResponse } from 'next/server';
import { uploadCover } from '@/lib/cloudinary';
import { checkRateLimit, RATE_LIMITS } from '@/lib/rateLimit';
import { getIpFromRequest } from '@/lib/logger';

const MAX_BYTES = 5 * 1024 * 1024;

/** Check the file's actual signature — the browser-supplied type is only a claim. */
function looksLikeImage(bytes: Buffer): boolean {
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
  const webp = bytes.subarray(0, 4).toString('ascii') === 'RIFF' && bytes.subarray(8, 12).toString('ascii') === 'WEBP';
  return jpeg || png || webp;
}

export async function POST(req: NextRequest) {
  try {
    const rate = await checkRateLimit(getIpFromRequest(req) || 'unknown', RATE_LIMITS.IMAGE_UPLOAD);
    if (!rate.allowed) return NextResponse.json({ error: rate.message }, { status: 429 });

    const form = await req.formData().catch(() => null);
    const image = form?.get('image');
    if (!(image instanceof File)) return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    if (image.size > MAX_BYTES) return NextResponse.json({ error: 'Image must be under 5 MB' }, { status: 400 });

    const buffer = Buffer.from(await image.arrayBuffer());
    if (!looksLikeImage(buffer)) return NextResponse.json({ error: 'Image must be JPEG, PNG or WebP' }, { status: 400 });

    return NextResponse.json({ success: true, imageUrl: await uploadCover(buffer) });
  } catch (error) {
    console.error('Image upload error:', error);
    return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 });
  }
}
