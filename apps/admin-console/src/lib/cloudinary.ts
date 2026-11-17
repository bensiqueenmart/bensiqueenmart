/**
 * Cloudinary client for the image editor. Mirrors EDIT_CONSOLE.md §10:
 * compress before upload, fetch a server signature, upload direct from the
 * browser to Cloudinary. The API secret never touches this code.
 */

const MAX_DIM = 1200;
const MAX_BYTES = 500 * 1024;

export interface SignResponse {
  cloudName: string;
  apiKey: string;
  folder: string;
  timestamp: number;
  signature: string;
}

/** Accept https URLs and legacy local `/images/…` paths. Length-capped. */
export function isValidImageUrl(url: string): boolean {
  const v = url.trim();
  if (!v || v.length > 2000) return false;
  if (v.startsWith('/images/')) return true;
  try {
    const u = new URL(v);
    return u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** True for this project's Cloudinary delivery URLs. */
export function isCloudinaryUrl(url: string, cloudName?: string): boolean {
  try {
    const u = new URL(url);
    if (!u.hostname.endsWith('res.cloudinary.com')) return false;
    return cloudName ? u.pathname.startsWith(`/${cloudName}/`) : true;
  } catch {
    return false;
  }
}

function loadImage(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('could not read image file'));
    };
    img.src = url;
  });
}

/**
 * Compress per the doc: skip when already small (≤1200px, ≤500KB),
 * else scale to max 1200px (never upscale), WebP first with JPEG fallback.
 */
export async function prepareImage(file: File): Promise<Blob> {
  let img: HTMLImageElement;
  try {
    img = await loadImage(file);
  } catch {
    return file;
  }
  const longest = Math.max(img.naturalWidth, img.naturalHeight);
  if (longest <= MAX_DIM && file.size <= MAX_BYTES) return file;
  const scale = Math.min(1, MAX_DIM / longest);
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return file;
  ctx.drawImage(img, 0, 0, w, h);
  const toBlob = (type: string, quality: number): Promise<Blob | null> =>
    new Promise((resolve) => canvas.toBlob(resolve, type, quality));
  return (await toBlob('image/webp', 0.82)) ?? (await toBlob('image/jpeg', 0.85)) ?? file;
}

export async function getImageSignature(folder: 'products' | 'combos' = 'products'): Promise<SignResponse> {
  const res = await fetch('/api/images/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error ?? `sign failed (${res.status})`);
  return body as SignResponse;
}

/** Signed direct upload. File never passes through our API. */
export async function uploadImage(file: Blob, kind: 'products' | 'combos' = 'products'): Promise<string> {
  const prepared = file instanceof File ? await prepareImage(file) : file;
  const sig = await getImageSignature(kind);
  const form = new FormData();
  form.append('file', prepared);
  form.append('api_key', sig.apiKey);
  form.append('timestamp', String(sig.timestamp));
  form.append('folder', sig.folder);
  form.append('signature', sig.signature);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/image/upload`, {
    method: 'POST',
    body: form,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body?.error?.message ?? `upload failed (${res.status})`);
  if (typeof body?.secure_url !== 'string') throw new Error('upload returned no secure_url');
  return body.secure_url as string;
}
