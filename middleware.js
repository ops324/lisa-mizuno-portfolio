export const config = {
  matcher: '/:path*',
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
