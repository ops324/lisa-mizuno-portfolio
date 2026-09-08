// ─── schedule.json ↔ GitHub ───
// The admin writes through the GitHub Contents API rather than a database:
// the public page keeps serving a static schedule.json from the CDN (so the
// GitHub Pages mirror keeps working too), and every edit lands in git history
// where it can be inspected and reverted.

const API = 'https://api.github.com';
const FILE = 'schedule.json';

function settings() {
  const repo = process.env.GITHUB_REPO;
  const branch = process.env.GITHUB_BRANCH || 'main';
  const token = process.env.GITHUB_TOKEN;
  return { repo, branch, token, ok: Boolean(repo && token) };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
    // GitHub rejects API requests without one.
    'User-Agent': 'lisa-mizuno-portfolio-admin',
  };
}

// Turn a GitHub error response into something the admin screen can explain.
// Without this every failure reads "時間をおいてお試しください", which is
// actively misleading for an expired token — waiting never fixes that.
//
// Note the 404: a fine-grained token that has lost access to the repository
// gets 404 rather than 403, so "見つからない" and "権限が外れた" arrive as the
// same status and share a message.
export function classify(res) {
  const err = new Error(`GitHub API ${res.status}`);
  err.status = res.status;

  if (res.status === 401) {
    err.reason = 'token';
  } else if (res.status === 403 || res.status === 429) {
    err.reason = res.headers.get('x-ratelimit-remaining') === '0' ? 'rate' : 'permission';
  } else if (res.status === 404) {
    err.reason = 'missing';
  } else if (res.status === 409 || res.status === 422) {
    err.conflict = true;
  }
  return err;
}

// Returns { events, updated, sha }. The blob sha is what makes the write
// safe: GitHub refuses the update if the file moved on in the meantime, so
// two admins editing at once get a conflict instead of a silent overwrite.
export async function readSchedule() {
  const { repo, branch, token, ok } = settings();
  if (!ok) throw new Error('GitHub is not configured');

  const url = `${API}/repos/${repo}/contents/${FILE}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, { headers: headers(token), cache: 'no-store' });
  if (!res.ok) throw classify(res);

  const body = await res.json();
  const json = JSON.parse(Buffer.from(body.content, 'base64').toString('utf8'));
  return {
    events: Array.isArray(json.events) ? json.events : [],
    updated: typeof json.updated === 'string' ? json.updated : '',
    sha: body.sha,
  };
}

export async function writeSchedule(events, sha, message) {
  const { repo, branch, token, ok } = settings();
  if (!ok) throw new Error('GitHub is not configured');

  // Two-space indent and a trailing newline so the committed file matches what
  // Biome would format — otherwise the CI lint job fails on the admin's commit.
  const payload = `${JSON.stringify({ updated: todayJST(), events }, null, 2)}\n`;

  const res = await fetch(`${API}/repos/${repo}/contents/${FILE}`, {
    method: 'PUT',
    headers: { ...headers(token), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      content: Buffer.from(payload, 'utf8').toString('base64'),
      sha,
      branch,
    }),
  });

  if (!res.ok) throw classify(res);

  return res.json();
}

// The site and its audience are in Japan; stamp the file in JST rather than
// whatever region the function happens to run in.
export function todayJST() {
  const jst = new Date(Date.now() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}
