import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Billing-desk auth — completely separate from admin-console.
 *
 * One shared counter credential, no roles, no session store (serverless-safe):
 * a successful login sets an HttpOnly SameSite=Strict cookie holding an
 * HMAC-signed token with a 60-minute expiry. `POST /api/auth/refresh` slides
 * that window forward while the desk is in use, so a long shift never loses
 * auth mid-bill. Every data endpoint calls `isAuthenticated` first.
 *
 * Credentials come ONLY from env (BILLING_USER / BILLING_PASS_SHA256 /
 * AUTH_SECRET). There are no fallback passwords and nothing is exposed to
 * the browser beyond the opaque cookie.
 */

const COOKIE_NAME = 'billing_session';
const SESSION_TTL_MS = 60 * 60 * 1000; // 60 min, renewed by /api/auth/refresh
const TOKEN_APP = 'billing';

// Brute-force throttle: 10 failed attempts per IP per 15 min.
// Module-local (per serverless instance) — defense in depth, not the only layer.
const MAX_FAILED_ATTEMPTS = 10;
const ATTEMPT_WINDOW_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; resetAt: number }>();

interface Config {
  user: string;
  passHash: string;
  secret: string;
}

function getConfig(): Config {
  const user = process.env.BILLING_USER;
  const passHash = process.env.BILLING_PASS_SHA256;
  const secret = process.env.AUTH_SECRET;
  if (!user || !passHash || !secret) {
    throw new Error('billing auth not configured — set BILLING_USER, BILLING_PASS_SHA256, AUTH_SECRET');
  }
  return {
    user: user.trim().toLowerCase(),
    passHash: passHash.trim().toLowerCase(),
    secret,
  };
}

function b64uEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64uDecode(s: string): Buffer {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/');
  return Buffer.from(padded + '='.repeat((4 - (padded.length % 4)) % 4), 'base64');
}

function sha256Hex(s: string): string {
  return createHash('sha256').update(s, 'utf8').digest('hex');
}

function safeEqualHex(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8');
  const bb = Buffer.from(b, 'utf8');
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

/** Short fingerprint of the configured password hash: changing the password invalidates live sessions. */
function passFingerprint(passHash: string): string {
  return sha256Hex(passHash).slice(0, 16);
}

/** Verify username + plaintext password against env. Never reveals which half failed. */
export function verifyCredentials(username: unknown, password: unknown): boolean {
  if (typeof username !== 'string' || typeof password !== 'string') return false;
  let cfg: Config;
  try {
    cfg = getConfig();
  } catch {
    return false;
  }

  const cleanUser = username.trim().toLowerCase();
  if (cleanUser !== cfg.user) return false;

  const pRaw = sha256Hex(password).toLowerCase();
  const pTrimmed = sha256Hex(password.trim()).toLowerCase();
  return safeEqualHex(pRaw, cfg.passHash) || safeEqualHex(pTrimmed, cfg.passHash);
}

/** True when this IP has exhausted its failed-attempt budget. */
export function isRateLimited(req: { headers?: Record<string, unknown> }): boolean {
  const ip = clientIp(req);
  const entry = failedAttempts.get(ip);
  if (!entry) return false;
  if (Date.now() > entry.resetAt) {
    failedAttempts.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILED_ATTEMPTS;
}

export function noteLoginFailure(req: { headers?: Record<string, unknown> }): void {
  const ip = clientIp(req);
  const now = Date.now();
  const entry = failedAttempts.get(ip);
  if (!entry || now > entry.resetAt) {
    failedAttempts.set(ip, { count: 1, resetAt: now + ATTEMPT_WINDOW_MS });
    return;
  }
  entry.count += 1;
}

export function clearLoginFailures(req: { headers?: Record<string, unknown> }): void {
  failedAttempts.delete(clientIp(req));
}

function clientIp(req: { headers?: Record<string, unknown> }): string {
  const fwd = req.headers?.['x-forwarded-for'];
  const raw = Array.isArray(fwd) ? fwd[0] : fwd;
  if (typeof raw === 'string' && raw.length > 0) return raw.split(',')[0].trim();
  return 'local';
}

/** Mint a session token for a (lowercased) username. Format: b64u(payload).b64u(sig). */
export function mintToken(username: string): string {
  const { secret, passHash } = getConfig();
  const payload = JSON.stringify({
    app: TOKEN_APP,
    u: username.trim().toLowerCase(),
    exp: Date.now() + SESSION_TTL_MS,
    fp: passFingerprint(passHash),
  });
  const sig = createHmac('sha256', secret).update(payload).digest();
  return `${b64uEncode(Buffer.from(payload, 'utf8'))}.${b64uEncode(sig)}`;
}

/** Returns the username if the token is authentic, unexpired, and matches the current password. */
export function verifyToken(token: string): string | null {
  let cfg: Config;
  try {
    cfg = getConfig();
  } catch {
    return null;
  }
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;

  let payloadRaw: string;
  let sig: Buffer;
  try {
    payloadRaw = b64uDecode(token.slice(0, dot)).toString('utf8');
    sig = b64uDecode(token.slice(dot + 1));
  } catch {
    return null;
  }

  const expected = createHmac('sha256', cfg.secret).update(payloadRaw).digest();
  if (sig.length !== expected.length || !timingSafeEqual(sig, expected)) return null;

  let payload: { app?: string; u?: string; exp?: number; fp?: string };
  try {
    payload = JSON.parse(payloadRaw);
  } catch {
    return null;
  }

  if (payload.app !== TOKEN_APP) return null;
  if (payload.u !== cfg.user) return null;
  if (payload.fp !== passFingerprint(cfg.passHash)) return null;
  if (typeof payload.exp !== 'number' || !Number.isFinite(payload.exp)) return null;
  if (Date.now() > payload.exp) return null;
  return payload.u;
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

/** Username from a valid billing session cookie, else null. */
export function sessionUser(req: { headers?: Record<string, unknown> }): string | null {
  const cookies = parseCookies(req.headers?.cookie);
  const token = cookies[COOKIE_NAME];
  if (typeof token !== 'string') return null;
  return verifyToken(token);
}

/** True when the request carries a valid billing session cookie. */
export function isAuthenticated(req: { headers?: Record<string, unknown> }): boolean {
  return sessionUser(req) !== null;
}

/** Set-Cookie value for login / refresh / logout (null clears the session). */
export function sessionCookie(token: string | null): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  if (token === null) {
    return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=0`;
  }
  const maxAge = Math.floor(SESSION_TTL_MS / 1000);
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${maxAge}`;
}

/** Session lifetime in ms — exposed so clients can schedule a refresh. */
export const SESSION_TTL = SESSION_TTL_MS;
