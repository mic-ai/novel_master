import { prisma } from '@/lib/db/prisma';
import { hashPassword } from '@/lib/db/password';

export async function POST(req: Request) {
  const body = await req.json() as { email?: string; password?: string; name?: string };
  const { email, password, name } = body;

  if (!email || !password) {
    return Response.json({ error: 'メールアドレスとパスワードは必須です' }, { status: 400 });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: '有効なメールアドレスを入力してください' }, { status: 400 });
  }

  if (password.length < 8) {
    return Response.json({ error: 'パスワードは8文字以上で設定してください' }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: 'このメールアドレスはすでに登録されています' }, { status: 409 });
  }

  const hashedPassword = hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      name:     name?.trim() || email.split('@')[0],
      password: hashedPassword,
    },
  });

  return Response.json({ success: true });
}
