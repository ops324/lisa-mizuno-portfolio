// ─── GET /api/schedule · PUT /api/schedule ───
// The admin's read and write path. The public page never touches this — it
// reads the static schedule.json straight from the CDN.

import { authorized } from './_lib/auth.js';
import { readSchedule, writeSchedule } from './_lib/github.js';
import { normalize } from './_lib/validate.js';

// A generic "時間をおいてお試しください" is wrong for most of these: an expired
// token or a missing permission never recovers on its own, and the person at
// the keyboard needs to know it is not their mistake.
const UPSTREAM = {
  token: {
    status: 502,
    text: 'GitHub トークンの有効期限が切れているか、無効になっている可能性があります。管理者にご連絡ください。',
  },
  permission: {
    status: 502,
    text: 'GitHub トークンの権限が不足している可能性があります（Contents: Read and write が必要です）。管理者にご連絡ください。',
  },
  missing: {
    status: 502,
    text: '保存先のファイルが見つかりません。GitHub トークンの対象リポジトリ設定をご確認ください。管理者にご連絡ください。',
  },
  rate: {
    status: 503,
    text: 'GitHub の利用制限に達しました。しばらく待ってからお試しください。',
  },
};

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

    const verb = req.method === 'PUT' ? '保存' : '読み込み';
    const known = UPSTREAM[err?.reason];
    if (known) {
      return res.status(known.status).json({ error: `${verb}できませんでした。${known.text}` });
    }
    return res.status(502).json({ error: `${verb}できませんでした。時間をおいてお試しください。` });
  }
}
