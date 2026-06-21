import NextAuth from 'next-auth';
import { PrismaAdapter } from '@auth/prisma-adapter';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/db/password';
import { authConfig } from './auth.config';

// セッション関連メソッドを除外して JWT セッションを強制
// （NextAuth v5 beta は Adapter 存在時にDB セッションを強制するため）
const {
  createSession: _cs,
  getSessionAndUser: _gsu,
  updateSession: _us,
  deleteSession: _ds,
  ...adapterWithoutSessions
} = PrismaAdapter(prisma);

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where:  { email: credentials.email as string },
          select: { id: true, email: true, name: true, plan: true, password: true },
        });
        if (!user?.password) return null;
        const valid = verifyPassword(credentials.password as string, user.password);
        if (!valid) return null;
        return { id: user.id, email: user.email!, name: user.name ?? undefined, plan: user.plan };
      },
    }),
  ],
  adapter: adapterWithoutSessions,
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id   = user.id;
        token.plan = (user as { plan?: string }).plan ?? 'FREE';
      }
      return token;
    },
    session({ session, token }) {
      session.user.id   = token.id as string;
      session.user.plan = (token.plan as string) ?? 'FREE';
      return session;
    },
  },
});
