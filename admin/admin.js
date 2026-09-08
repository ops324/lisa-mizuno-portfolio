// ─── Schedule 管理画面 ───
// The editor holds the whole event list in memory and writes it back in one
// PUT. `sha` is the blob revision the list was loaded from; sending it back
// lets the server reject a save that would clobber someone else's edit.

const $ = (id) => document.getElementById(id);

const loginView = $('login-view');
const adminView = $('admin-view');
const fatalView = $('fatal-view');
const loading = $('loading');

let events = [];
let sha = '';
let dirty = false;
let editingIndex = null;

// Local date, not toISOString(): that is UTC and would mark today's event as
// finished for the first nine hours of every JST morning.
const now = new Date();
const pad = (n) => String(n).padStart(2, '0');
const today = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

// ─── helpers ───
const el = (tag, className, text) => {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text) node.textContent = text;
  return node;
};

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
  });
  let body = null;
  try {
    body = await res.json();
  } catch {
    // 204, or an error page from the platform rather than our handler
  }
  return { status: res.status, ok: res.ok, body };
}

function notify(text, kind) {
  const box = $('message');
  box.textContent = text;
  box.className = kind ? `note note--${kind}` : 'note';
  box.hidden = !text;
}

function setDirty(value) {
  dirty = value;
  $('status').textContent = value ? '未保存の変更あり' : '保存済み';
  $('status').classList.toggle('dirty', value);
  $('save').disabled = !value;
  $('savemsg').textContent = value ? '未保存の変更があります' : '変更はありません';
}

// ─── 一覧 ───
function renderList() {
  const rows = $('rows');
  rows.textContent = '';
  $('count').textContent = String(events.length);

  if (!events.length) {
    rows.appendChild(
      el('p', 'empty', 'まだイベントがありません。「＋ 新規追加」から登録してください。'),
    );
    return;
  }

  events.forEach((e, index) => {
    const row = el('div', `row${e.status === 'draft' ? ' is-draft' : ''}`);

    row.appendChild(
      el(
        'span',
        'row-date',
        e.time ? `${e.date.replace(/-/g, '.')}　${e.time}` : e.date.replace(/-/g, '.'),
      ),
    );

    const body = el('span');
    body.appendChild(el('span', 'row-title', e.title));
    const place = [e.venue, e.city].filter(Boolean).join(' — ');
    if (place) body.appendChild(el('span', 'row-venue', place));

    const badges = el('span', 'badges');
    if (e.status === 'draft') badges.appendChild(el('span', 'badge badge--draft', '下書き'));
    if (e.date < today) badges.appendChild(el('span', 'badge badge--past', '終了'));
    if (e.tag) badges.appendChild(el('span', 'badge', e.tag));
    if (!e.url) badges.appendChild(el('span', 'badge', 'リンクなし'));
    if (badges.childNodes.length) body.appendChild(badges);
    row.appendChild(body);

    const actions = el('span', 'row-actions');
    const edit = el('button', 'btn btn--quiet', '編集');
    edit.type = 'button';
    edit.addEventListener('click', () => openForm(index));
    actions.appendChild(edit);
    row.appendChild(actions);

    rows.appendChild(row);
  });
}

// ─── フォーム ───
function openForm(index) {
  editingIndex = index;
  const e =
    index === null
      ? {
          date: '',
          time: '',
          title: '',
          venue: '',
          city: '',
          url: '',
          tag: '',
          status: 'published',
        }
      : events[index];

  $('form-title').textContent = index === null ? '新しいイベント' : 'イベントを編集';
  $('f-date').value = e.date;
  $('f-time').value = e.time;
  $('f-title').value = e.title;
  $('f-venue').value = e.venue;
  $('f-city').value = e.city;
  $('f-url').value = e.url;
  $('f-tag').value = e.tag;
  $('f-status').value = e.status;
  $('delete').style.display = index === null ? 'none' : '';
  $('form').hidden = false;
  $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeForm() {
  $('form').hidden = true;
  editingIndex = null;
}

function sortEvents() {
  events.sort((a, b) => b.date.localeCompare(a.date));
}

$('new').addEventListener('click', () => openForm(null));
$('cancel').addEventListener('click', closeForm);

$('delete').addEventListener('click', () => {
  if (editingIndex === null) return;
  const target = events[editingIndex];
  if (!window.confirm(`「${target.title}」を削除します。よろしいですか？`)) return;
  events.splice(editingIndex, 1);
  closeForm();
  setDirty(true);
  renderList();
});

$('form').addEventListener('submit', (ev) => {
  ev.preventDefault();
  const next = {
    date: $('f-date').value,
    time: $('f-time').value,
    title: $('f-title').value.trim(),
    venue: $('f-venue').value.trim(),
    city: $('f-city').value.trim(),
    url: $('f-url').value.trim(),
    tag: $('f-tag').value,
    status: $('f-status').value,
  };
  if (!next.date || !next.title) {
    notify('日付とタイトルは必須です。', 'error');
    return;
  }
  if (editingIndex === null) events.push(next);
  else events[editingIndex] = next;

  sortEvents();
  closeForm();
  notify('');
  setDirty(true);
  renderList();
});

// ─── 保存 ───
$('save').addEventListener('click', async () => {
  const button = $('save');
  button.disabled = true;
  $('savemsg').textContent = '保存しています…';

  const { status, ok, body } = await api('/api/schedule', {
    method: 'PUT',
    body: JSON.stringify({ events, sha }),
  });

  if (ok) {
    if (body?.sha) sha = body.sha;
    setDirty(false);
    notify(
      '保存しました。サイトへの反映まで 30〜60 秒ほどかかります。反映後、サイトを再読み込みしてご確認ください。',
      'ok',
    );
    return;
  }

  button.disabled = false;
  if (status === 401) {
    notify(
      'ログインの有効期限が切れました。画面を再読み込みしてログインし直してください。',
      'error',
    );
    return;
  }
  notify(body?.error || '保存に失敗しました。時間をおいてお試しください。', 'error');
  $('savemsg').textContent = '未保存の変更があります';
});

$('view-site').addEventListener('click', () => window.open('/', '_blank', 'noopener'));

$('retry').addEventListener('click', () => window.location.reload());

$('logout').addEventListener('click', async () => {
  if (dirty && !window.confirm('未保存の変更があります。破棄してログアウトしますか？')) return;
  await api('/api/login', { method: 'DELETE' });
  window.location.reload();
});

// ─── ログイン ───
$('login-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const button = $('login-btn');
  const error = $('login-error');
  button.disabled = true;
  error.hidden = true;

  const { ok, body } = await api('/api/login', {
    method: 'POST',
    body: JSON.stringify({ password: $('password').value }),
  });

  button.disabled = false;
  if (!ok) {
    error.textContent = body?.error || 'ログインできませんでした。';
    error.hidden = false;
    $('password').value = '';
    return;
  }
  $('password').value = '';
  await load();
});

// ─── 起動 ───
async function load() {
  loginView.hidden = true;
  adminView.hidden = true;
  fatalView.hidden = true;
  loading.hidden = false;

  const { status, ok, body } = await api('/api/schedule');
  loading.hidden = true;

  if (status === 401) {
    loginView.hidden = false;
    return;
  }
  if (!ok) {
    // Logged in, but the backend could not answer — an expired GitHub token,
    // for instance. Say so instead of showing a password box.
    $('fatal-message').textContent =
      body?.error || '読み込みできませんでした。時間をおいてお試しください。';
    fatalView.hidden = false;
    return;
  }

  events = Array.isArray(body.events) ? body.events : [];
  sha = body.sha || '';
  sortEvents();
  adminView.hidden = false;
  setDirty(false);
  renderList();
}

window.addEventListener('beforeunload', (ev) => {
  if (!dirty) return;
  ev.preventDefault();
  ev.returnValue = '';
});

load();
