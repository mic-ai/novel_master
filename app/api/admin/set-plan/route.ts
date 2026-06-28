import { auth } from '@/lib/auth';
import { prisma } from '@/lib/db/prisma';
import { Plan } from '@prisma/client';

function isAdminEmail(email: string): boolean {
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ isAdmin: false });
  }
  return Response.json({ isAdmin: isAdminEmail(session.user.email) });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id || !session.user.email) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  if (!isAdminEmail(session.user.email)) {
    return Response.json({ error: '管理者権限がありません' }, { status: 403 });
  }

  const { plan } = await req.json() as { plan?: string };
  const validPlans: Plan[] = ['FREE', 'STARTER', 'PRO', 'TEAM'];
  if (!plan || !(validPlans as string[]).includes(plan)) {
    return Response.json({ error: '無効なプランです' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data:  { plan: plan as Plan },
  });

  return Response.json({ success: true, plan });
}
