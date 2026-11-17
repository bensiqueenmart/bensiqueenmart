import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Single-admin auth for the admin console. One user, no roles, no session
 * store (serverless-safe): a successful login sets an HttpOnly
 * SameSite=Strict cookie holding an HMAC-signed token with a 30min expiry.
 * Every other endpoint calls `assertAuth` first and 401s without it.
 */

const COOKIE_NAME = 'admin_session';
const SESSION_TTL_MS = 30 * 60 * 1000;

function b64uEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64');
}

function getConfig(): { user: string; passHash: string; secret: string } {
  const user = process.env.ADMIN_USER;
  const passHash = process.env.ADMIN_PASS_SHA256;
  const secret = process.env.AUTH_SECRET;
  if (!user || !passHash || !secret) {
    throw new Error('auth not configured — set ADMIN_USER, ADMIN_PASS_SHA256, AUTH_SECRET');
  }
  return { user, passHash, secret };
}

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Verify username + plaintext password against env. Never reveals which half failed. */
export function verifyCredentials(username: unknown, password: unknown): boolean {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  let cfg: { user: string; passHash: string; secret: string };
  try {
    cfg = getConfig();
  } catch {
    return false;
  }
  if (username !== cfg.user) return false;
  // ADMIN_PASS_SHA256 is generated via: echo -n '<password>' | shasum -a 256
  return safeEqualHex(sha256Hex(password), cfg.passHash.toLowerCase());
}

/** Mint a session token for `username`. Format: b64u(payload).b64u(sig). */
export function mintToken(username: string): string {
  const { secret } = getConfig();
  const payload = `${username}:${Date.now() + SESSION_TTL_MS}`;
  const sig = createHmac('sha256', secret).update(payload).digest();
  return `${b64uEncode(Buffer.from(payload, 'utf8'))}.${b64uEncode(sig)}`;
}

/** Returns the username if the token is authentic and unexpired, else null. */
export function verifyToken(token: string): string | null {
  let cfg: { user: string; passHash: string; secret: string };
  try {
    cfg = getConfig();
  } catch {
    return null;
  }
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  let payload: string;
  let sig: Buffer;
  try {
    payload = b64uDecode(token.slice(0, dot)).toString('utf8');
    sig = b64uDecode(token.slice(dot + 1));
  } catch {
    return null;
  }
  const expected = createHmac('sha256', cfg.secret).update(payload).digest();
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;
  const sep = payload.lastIndexOf(':');
  if (sep <= 0) return null;
  const username = payload.slice(0, sep);
  const exp = Number(payload.slice(sep + 1));
  if (!Number.isFinite(exp) || Date.now() > exp) return null;
  if (username !== cfg.user) return null;
  return username;
}

function parseCookies(header: unknown): Record<string, string> {
  if (typeof header !== 'string') return {};
  const out: Record<string, string> = {};
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq <= 0) continue;
    out[part.slice(0, eq).trim()] = decodeURIComponent(part.slice(eq + 1).trim());
  }
  return out;
}

/** True when the request carries a valid admin session cookie. */
export function isAuthenticated(req: { headers?: Record<string, unknown> }): boolean {
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[COOKIE_NAME];
  return typeof token === 'string' && verifyToken(token) !== null;
}

/** Set-Cookie value for login / logout (null clears the session). */
export function sessionCookie(token: string | null): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  if (token === null) {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=0`;
  }
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAge}`;
}
