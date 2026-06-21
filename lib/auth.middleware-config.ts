import type { NextAuthConfig } from 'next-auth';

// Edge Runtime 専用設定 — Google/GitHub provider を一切インポートしない
// auth.config.ts は Node.js 環境専用（providers を含むため Edge 非対応）
export const authMiddlewareConfig: NextAuthConfig = {
  secret:    process.env.AUTH_SECRET,
  session:   { strategy: 'jwt' },
  pages:     { signIn: '/login' },
  providers: [],
  callbacks: {
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
  },
};
