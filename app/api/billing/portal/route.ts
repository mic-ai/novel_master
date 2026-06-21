import { auth } from '@/lib/auth';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.stripeCustomerId) {
    return Response.json({ error: 'サブスクリプションが見つかりません' }, { status: 400 });
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000';
  const portalSession = await getStripe().billingPortal.sessions.create({
    customer:   user.stripeCustomerId,
    return_url: `${origin}/settings`,
  });

  return Response.json({ url: portalSession.url });
}
