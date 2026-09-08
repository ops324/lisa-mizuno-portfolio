// ─── GET /api/schedule · PUT /api/schedule ───
// The admin's read and write path. The public page never touches this — it
// reads the static schedule.json straight from the CDN.

import { authorized } from './_lib/auth.js';
import { readSchedule, writeSchedule } from './_lib/github.js';
import { normalize } from './_lib/validate.js';

export default async function handler(req, res) {
  // Nothing here is public, including reads: draft events must not leak.
  if (!authorized(req)) {
    return res.status(401).json({ error: 'ログインしてください' });
  }

  // Admin data is per-request and must never sit in a shared cache.
  res.setHeader('Cache-Control', 'no-store');

  try {
    if (req.method === 'GET') {
      const { events, updated, sha } = await readSchedule();
      return res.status(200).json({ events, updated, sha });
    }

    if (req.method === 'PUT') {
      const sha = req.body?.sha;
      if (typeof sha !== 'string' || !sha) {
        return res.status(400).json({ error: '保存に必要な情報が不足しています' });
      }

      const events = normalize(req.body);
      const published = events.filter((e) => e.status === 'published').length;
      const message = `Schedule: 更新（全 ${events.length} 件 / 公開 ${published} 件）`;

      const result = await writeSchedule(events, sha, message);
      // Hand back the new blob sha so a second save in the same session does
      // not collide with the commit the first one just made.
      return res.status(200).json({ ok: true, count: events.length, sha: result?.content?.sha });
    }

    res.setHeader('Allow', 'GET, PUT');
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    if (err?.invalid) {
      return res.status(400).json({ error: err.message });
    }
    if (err?.conflict) {
      return res.status(409).json({
        error: '別の端末から更新されています。画面を再読み込みしてからやり直してください。',
      });
    }
    // Never echo the upstream message: it can carry repository details.
    console.error('[schedule]', err);
    return res.status(502).json({ error: '保存に失敗しました。時間をおいてお試しください。' });
  }
}
