import { NextRequest, NextResponse } from 'next/server';

const PROTECTED_PATHS = ['/projects', '/editor', '/settings'];

// next-auth v5 が設定するセッション Cookie 名（HTTP と HTTPS で異なる）
const SESSION_COOKIE_NAMES = [
  '__Secure-authjs.session-token', // HTTPS（本番）
  'authjs.session-token',          // HTTP（開発）
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const hasSession = SESSION_COOKIE_NAMES.some(
    name => !!request.cookies.get(name)?.value
  );

  if (isProtected && !hasSession) {
    const loginUrl = new URL('/login', request.nextUrl.origin);
    loginUrl.searchParams.set('callbackUrl', pathname);
    return NextResponse.redirect(loginUrl);
  }
  if (pathname === '/login' && hasSession) {
    return NextResponse.redirect(new URL('/projects', request.nextUrl.origin));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
