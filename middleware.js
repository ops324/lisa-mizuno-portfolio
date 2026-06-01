export const config = {
  // Gate every path EXCEPT the icon files, so the browser can load the
  // favicon / touch icon without auth (otherwise the tab icon 401s and the
  // browser shows a fallback). The page itself stays password-protected.
  matcher: ['/((?!favicon.svg|favicon.ico|apple-touch-icon.png).*)'],
};

// 資格情報は Vercel の環境変数で管理する（コードに直書きしない）。
//   BASIC_AUTH_USER / BASIC_AUTH_PASS
// 未設定の場合は「全拒否（fail-closed）」とし、誤って認証を無効化しない。
const EXPECTED_USER = process.env.BASIC_AUTH_USER;
const EXPECTED_PASS = process.env.BASIC_AUTH_PASS;

// タイミング攻撃を避けるための定数時間比較。
function safeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  // 環境変数が両方そろっている時だけ認証を許可（fail-closed）。
  if (EXPECTED_USER && EXPECTED_PASS && authHeader && authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const sep = decoded.indexOf(':');
    const username = sep === -1 ? decoded : decoded.slice(0, sep);
    const password = sep === -1 ? '' : decoded.slice(sep + 1);

    // 短絡評価で情報を漏らさないよう、両方を必ず評価する。
    const userOk = safeEqual(username, EXPECTED_USER);
    const passOk = safeEqual(password, EXPECTED_PASS);
    if (userOk && passOk) {
      return; // 認証OK → そのまま通す
    }
  }

  return new Response('Authentication Required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Preview", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
}
