import { createHash } from 'node:crypto';
import { isAuthenticated } from '../../server/_auth.js';

/**
 * POST /api/images/sign — sign a Cloudinary upload for the image editor.
 * Body: { folder?: 'products' | 'combos' }. Returns { cloudName, apiKey,
 * folder, timestamp, signature } for a direct browser → Cloudinary upload.
 *
 * Security: admin session cookie required; the API secret never leaves the
 * server; folder is an allowlist (never free-form); no unsigned presets.
 * Signature = sha1(`folder=<folder>&timestamp=<ts>` + secret), params sorted
 * per Cloudinary's signing rule. Timestamps go stale server-side by
 * Cloudinary's own expiry (~1h), so replay windows are short.
 */
const FOLDERS = ['bqm/products', 'bqm/combos'] as const;

function getCloudinaryConfig() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('cloudinary not configured — set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
  }
  return { cloudName, apiKey, apiSecret };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any): Promise<void> {
  if (!isAuthenticated(req)) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }
  try {
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'method not allowed' });
      return;
    }
    const short = typeof req.body?.folder === 'string' ? req.body.folder : 'products';
    const folder = `bqm/${short}`;
    if (!(FOLDERS as readonly string[]).includes(folder)) {
      res.status(400).json({ error: 'invalid folder (expected products | combos)' });
      return;
    }
    const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = createHash('sha1').update(`folder=${folder}&timestamp=${timestamp}${apiSecret}`).digest('hex');
    res.status(200).json({ cloudName, apiKey, folder, timestamp, signature });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'internal error';
    res.status(400).json({ error: message });
  }
}
