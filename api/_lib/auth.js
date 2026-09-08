// ─── Admin session ───
// No database: the session is a signed token in an HttpOnly cookie. The
// payload carries nothing but an expiry, so a stolen cookie is useless once
// it lapses and there is no server state to keep in sync.
//
// Files under api/_lib/ are helpers, not endpoints — Vercel skips anything
// whose path segment starts with an underscore.

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const COOKIE = 'lm_admin';
const TTL_MS = 8 * 60 * 60 * 1000; // 8h — long enough for one editing session

// Compare two secrets without leaking their length or contents through
// timing. timingSafeEqual() throws on length mismatch, so hash first: the
// digests are always 32 bytes.
export function safeEqual(a, b) {
  const ha = createHash('sha256')
    .update(String(a ?? ''))
    .digest();
  const hb = createHash('sha256')
    .update(String(b ?? ''))
    .digest();
  return timingSafeEqual(ha, hb);
}

export function sign(secret, ttl = TTL_MS) {
  const body = Buffer.from(JSON.stringify({ exp: Date.now() + ttl })).toString('base64url');
  const mac = createHmac('sha256', secret).update(body).digest('base64url');
  return `${body}.${mac}`;
}

export function verify(token, secret) {
  if (typeof token !== 'string') return false;
  const dot = token.indexOf('.');
  if (dot < 1) return false;

  const body = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = createHmac('sha256', secret).update(body).digest('base64url');
  if (!safeEqual(mac, expected)) return false;

  try {
    const { exp } = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    return typeof exp === 'number' && exp > Date.now();
  } catch {
    return false;
  }
}

export function readCookie(req, name) {
  const header = req.headers?.cookie;
  if (!header) return '';
  for (const part of header.split(';')) {
    const eq = part.indexOf('=');
    if (eq < 0) continue;
    if (part.slice(0, eq).trim() === name) return decodeURIComponent(part.slice(eq + 1).trim());
  }
  return '';
}

export function sessionCookie(value, maxAgeSec) {
  // Secure + HttpOnly + SameSite=Strict: unreadable from JS, never sent
  // cross-site, never sent over plain HTTP.
  return [
    `${COOKIE}=${value}`,
    'Path=/',
    'HttpOnly',
    'Secure',
    'SameSite=Strict',
    `Max-Age=${maxAgeSec}`,
  ].join('; ');
}

// Every endpoint needs both, and a missing one must fail closed rather than
// fall back to an empty-string secret that anything would match.
export function config() {
  const password = process.env.ADMIN_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  return { password, secret, ok: Boolean(password && secret) };
}

export function authorized(req) {
  const { secret, ok } = config();
  return ok && verify(readCookie(req, COOKIE), secret);
}
