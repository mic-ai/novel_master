import NextAuth from 'next-auth';
import { authMiddlewareConfig } from '@/lib/auth.config';

// Edge Runtime 対応：providers なしの最小設定で JWT 検証のみ行う
// auth.ts の PrismaAdapter インスタンスとは別インスタンスだが、
// 同じ AUTH_SECRET を使うことで JWE トークンを正しく復号できる
export default NextAuth(authMiddlewareConfig).auth;

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
