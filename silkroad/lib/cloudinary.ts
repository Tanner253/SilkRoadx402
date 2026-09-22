/**
 * Campaign cover uploads. Covers display at 16:9, so they're shaped once here:
 * photos are cropped to fill, square logos are letterboxed in their own
 * edge colour so nothing important is cut off.
 */

import { v2 as cloudinary } from 'cloudinary';
import { CONFIG } from '@/config/constants';

let configured = false;

function configure() {
  if (configured) return;
  if (CONFIG.CLOUDINARY_URL) cloudinary.config({ cloudinary_url: CONFIG.CLOUDINARY_URL, secure: true });
  else
    cloudinary.config({
      cloud_name: CONFIG.CLOUDINARY_CLOUD_NAME,
      api_key: CONFIG.CLOUDINARY_API_KEY,
      api_secret: CONFIG.CLOUDINARY_API_SECRET,
      secure: true,
    });
  configured = true;
}

const FILL = { width: 1600, height: 900, crop: 'fill', gravity: 'auto' };
const LETTERBOX = { width: 1600, height: 900, crop: 'pad', background: 'auto:border' };
const DELIVERY = { quality: 'auto', fetch_format: 'auto' };

/**
 * Upload a cover and return its https URL. `source` is the file's bytes, or a
 * public https URL that Cloudinary fetches itself (so our server never makes
 * requests to arbitrary addresses).
 */
export async function uploadCover(source: Buffer | string, fit: 'fill' | 'letterbox' = 'fill'): Promise<string> {
  configure();
  const options = {
    folder: 'openfund',
    resource_type: 'image' as const,
    transformation: [fit === 'fill' ? FILL : LETTERBOX, DELIVERY],
  };

  const uploaded =
    typeof source === 'string'
      ? await cloudinary.uploader.upload(source, { ...options, timeout: 15_000 })
      : await new Promise<{ secure_url: string }>((resolve, reject) => {
          cloudinary.uploader
            .upload_stream(options, (error, result) => (error || !result ? reject(error) : resolve(result)))
            .end(source);
        });
  return uploaded.secure_url;
}
