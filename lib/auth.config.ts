import type { NextAuthConfig } from 'next-auth';
import Google from 'next-auth/providers/google';
import GitHub from 'next-auth/providers/github';

// 認可コールバック（Edge / Node.js 共通ロジック）
const authorizedCallback: NextAuthConfig['callbacks'] = {
  authorized({ auth, request: { nextUrl } }) {
    const isLoggedIn = !!auth?.user;
    const { pathname } = nextUrl;
    const isProtected =
      pathname.startsWith('/projects') ||
      pathname.startsWith('/editor') ||
      pathname.startsWith('/settings');

    if (isProtected && !isLoggedIn) {
      const loginUrl = new URL('/login', nextUrl.origin);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return Response.redirect(loginUrl);
    }
    if (pathname === '/login' && isLoggedIn) {
      return Response.redirect(new URL('/projects', nextUrl.origin));
    }
    return true;
  },
};

// ミドルウェア専用設定（providers 不要 — JWT 検証のみ）
// providers を含めると Edge での初期化に影響するため分離する
export const authMiddlewareConfig: NextAuthConfig = {
  secret:    process.env.AUTH_SECRET,
  session:   { strategy: 'jwt' },
  pages:     { signIn: '/login' },
  providers: [],
  callbacks: authorizedCallback,
};

// フル設定（sign-in 用 — auth.ts で使用）
export const authConfig: NextAuthConfig = {
  secret:    process.env.AUTH_SECRET,
  providers: [Google, GitHub],
  session:   { strategy: 'jwt' },
  pages:     { signIn: '/login' },
  callbacks: authorizedCallback,
};
