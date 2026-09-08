// ─── Payload validation ───
// The admin page validates as a courtesy; this is the copy that counts. Only
// known fields survive, so nothing the client invents reaches schedule.json,
// and every write stays within limits the public page can render.

const MAX_EVENTS = 300;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HHMM = /^([01]\d|2[0-3]):[0-5]\d$/;
const STATUS = new Set(['published', 'draft']);
const LIMITS = { title: 200, venue: 120, city: 120, tag: 40, url: 500 };

class Invalid extends Error {
  constructor(message) {
    super(message);
    this.invalid = true;
  }
}

// Rejects 2026-02-31 and friends: the regex only proves the shape.
function realDate(value) {
  if (!ISO_DATE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

function text(value, field, max, { required = false } = {}) {
  const s = typeof value === 'string' ? value.trim() : '';
  if (!s) {
    if (required) throw new Invalid(`${field}は必須です`);
    return '';
  }
  if (s.length > max) throw new Invalid(`${field}が長すぎます（最大 ${max} 文字）`);
  return s;
}

function link(value) {
  const s = text(value, 'リンク URL', LIMITS.url);
  if (!s) return '';
  let url;
  try {
    url = new URL(s);
  } catch {
    throw new Invalid('リンク URL の形式が正しくありません');
  }
  // Same rule the public page enforces when rendering: http(s) only.
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Invalid('リンク URL は http:// または https:// で始めてください');
  }
  return url.href;
}

export function normalize(body) {
  const raw = body && Array.isArray(body.events) ? body.events : null;
  if (!raw) throw new Invalid('events が配列ではありません');
  if (raw.length > MAX_EVENTS) throw new Invalid(`イベントが多すぎます（最大 ${MAX_EVENTS} 件）`);

  const events = raw.map((e, i) => {
    if (!e || typeof e !== 'object') throw new Invalid(`${i + 1} 件目の形式が不正です`);

    const date = typeof e.date === 'string' ? e.date.trim() : '';
    if (!realDate(date)) throw new Invalid(`${i + 1} 件目の日付が正しくありません`);

    const time = typeof e.time === 'string' ? e.time.trim() : '';
    if (time && !HHMM.test(time)) throw new Invalid(`${i + 1} 件目の開始時刻が正しくありません`);

    const status = STATUS.has(e.status) ? e.status : 'draft';

    return {
      date,
      time,
      title: text(e.title, `${i + 1} 件目のタイトル`, LIMITS.title, { required: true }),
      venue: text(e.venue, `${i + 1} 件目の会場`, LIMITS.venue),
      city: text(e.city, `${i + 1} 件目の都市`, LIMITS.city),
      url: link(e.url),
      tag: text(e.tag, `${i + 1} 件目のラベル`, LIMITS.tag),
      status,
    };
  });

  // Stored newest-first so the file reads like the admin list; the public page
  // sorts for itself anyway.
  events.sort((a, b) => b.date.localeCompare(a.date));
  return events;
}

export { Invalid };
