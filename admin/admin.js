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

function notify(text, kind, lead) {
  const box = $('message');
  box.textContent = '';
  if (lead) {
    // textContent で組む（innerHTML は使わない）。強調は要素で表現する。
    const strong = document.createElement('strong');
    strong.textContent = lead;
    box.appendChild(strong);
    box.appendChild(document.createTextNode(` ${text}`));
  } else {
    box.textContent = text;
  }
  box.className = kind ? `note note--${kind}` : 'note';
  box.hidden = !text && !lead;
}

// 一覧をいじっただけでは何も公開されない。次に押すべきボタンを毎回名指しする。
function notifyUnsaved(what) {
  notify(
    'サイトに反映するには、画面下の「保存して公開」を押してください。',
    'pending',
    `${what}しました。まだ公開されていません。`,
  );
}

function setDirty(value) {
  dirty = value;
  $('status').textContent = value ? '未保存の変更あり' : '保存済み';
  $('status').classList.toggle('dirty', value);
  $('save').disabled = !value;
  $('savemsg').textContent = value
    ? '未保存の変更があります。右のボタンで公開してください'
    : '変更はありません';
  $('savebar').classList.toggle('is-dirty', value);
  if (!value && logoutArmed) {
    logoutArmed = false;
    $('logout').textContent = 'ログアウト';
  }
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
  // 「確定」と書くと保存が済んだように読めるため、一覧を操作するだけだと分かる語に。
  $('form-submit').textContent = index === null ? '一覧に追加' : '変更を反映';
  $('f-date').value = e.date;
  $('f-time').value = e.time;
  $('f-title').value = e.title;
  $('f-venue').value = e.venue;
  $('f-city').value = e.city;
  $('f-url').value = e.url;
  $('f-tag').value = e.tag;
  $('f-status').value = e.status;
  $('delete').style.display = index === null ? 'none' : '';
  armDelete(false);
  $('form').hidden = false;
  $('form').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function closeForm() {
  $('form').hidden = true;
  armDelete(false);
  editingIndex = null;
}

function sortEvents() {
  events.sort((a, b) => b.date.localeCompare(a.date));
}

$('new').addEventListener('click', () => openForm(null));
$('cancel').addEventListener('click', closeForm);

// window.confirm() はブラウザやコンテンツブロッカーに抑制されることがある。
// 抑制されると false が即座に返るため、コードは「キャンセルされた」と判断して
// 黙って終了する ―― 利用者には「押しても無反応」にしか見えない。確認は画面内で行う。
function armDelete(on) {
  $('delete').hidden = on;
  $('delete-confirm').hidden = !on;
}

$('delete').addEventListener('click', () => {
  if (editingIndex === null) {
    // 黙って return しない。無反応は利用者にとって故障と区別がつかない。
    notify('削除する対象が選ばれていません。一覧の「編集」から開き直してください。', 'error');
    return;
  }
  armDelete(true);
});

$('delete-no').addEventListener('click', () => armDelete(false));

$('delete-yes').addEventListener('click', () => {
  if (editingIndex === null) return;
  events.splice(editingIndex, 1);
  armDelete(false);
  closeForm();
  setDirty(true);
  renderList();
  notifyUnsaved('一覧から削除');
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
  const added = editingIndex === null;
  if (added) events.push(next);
  else events[editingIndex] = next;

  sortEvents();
  closeForm();
  setDirty(true);
  renderList();
  notifyUnsaved(added ? '一覧に追加' : '内容を変更');
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

// 同じく confirm() に頼らない。抑制されると「未保存の変更があるとログアウト
// できない（しかも無反応）」という状態に陥る。
let logoutArmed = false;

$('logout').addEventListener('click', async () => {
  if (dirty && !logoutArmed) {
    logoutArmed = true;
    $('logout').textContent = '破棄してログアウト';
    notify(
      'もう一度「破棄してログアウト」を押すと、変更を捨ててログアウトします。',
      'pending',
      '未保存の変更があります。',
    );
    return;
  }
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
