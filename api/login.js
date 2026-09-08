// ─── POST /api/login · DELETE /api/login ───
// Password in, signed session cookie out. Nothing is stored server-side.

import { config, safeEqual, sessionCookie, sign } from './_lib/auth.js';

const FAILURE_DELAY_MS = 400;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export default async function handler(req, res) {
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', sessionCookie('', 0));
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password, secret, ok } = config();
  if (!ok) {
    // Fail closed: without both env vars there is no way to tell a real
    // password from an empty one.
    return res.status(503).json({ error: '管理機能が設定されていません' });
  }

  const given = req.body?.password;
  if (typeof given !== 'string' || !given) {
    await sleep(FAILURE_DELAY_MS);
    return res.status(401).json({ error: 'パスワードが違います' });
  }

  if (!safeEqual(given, password)) {
    // A fixed delay on every failure — crude, but it takes an online guessing
    // run from thousands of tries a second down to a couple.
    await sleep(FAILURE_DELAY_MS);
    return res.status(401).json({ error: 'パスワードが違います' });
  }

  res.setHeader('Set-Cookie', sessionCookie(sign(secret), 8 * 60 * 60));
  return res.status(200).json({ ok: true });
}
