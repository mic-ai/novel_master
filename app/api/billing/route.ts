import { auth } from '@/lib/auth';
import { getStripe, STRIPE_PRICE_IDS } from '@/lib/stripe';
import { PLANS } from '@/lib/plans';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: '認証が必要です' }, { status: 401 });
  }

  const body = await req.json() as { plan: 'STARTER' | 'PRO' | 'TEAM' };
  const planConfig = PLANS[body.plan];
  if (!planConfig) {
    return Response.json({ error: '無効なプランです' }, { status: 400 });
  }

  const priceId = STRIPE_PRICE_IDS[body.plan];
  if (!priceId) {
    return Response.json({ error: 'Stripe Price ID が未設定です' }, { status: 500 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) {
    return Response.json({ error: 'ユーザーが見つかりません' }, { status: 404 });
  }

  // Stripe カスタマーを取得または作成
  let customerId = user.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await getStripe().customers.create({
      email:    user.email,
      name:     user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;
    await prisma.user.update({
      where: { id: user.id },
      data:  { stripeCustomerId: customerId },
    });
  }

  const origin = req.headers.get('origin') ?? 'http://localhost:3000';
  const checkoutSession = await getStripe().checkout.sessions.create({
    customer:    customerId,
    mode:        'subscription',
    line_items:  [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/settings?upgraded=1`,
    cancel_url:  `${origin}/settings`,
    metadata:    { userId: user.id, plan: body.plan },
  });

  return Response.json({ url: checkoutSession.url });
}
