export const config = {
  // Gate every path EXCEPT the icon files, so the browser can load the
  // favicon / touch icon without auth (otherwise the tab icon 401s and the
  // browser shows a fallback). The page itself stays password-protected.
  matcher: ['/((?!favicon.svg|favicon.ico|apple-touch-icon.png).*)'],
};

export default function middleware(request) {
  const authHeader = request.headers.get('authorization');

  if (authHeader && authHeader.startsWith('Basic ')) {
    const base64 = authHeader.slice(6);
    const decoded = atob(base64);
    const [username, password] = decoded.split(':');

    if (username === 'lisa' && password === 'preview2026') {
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
