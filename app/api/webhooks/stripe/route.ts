import Stripe from 'stripe';
import { getStripe, planFromPriceId } from '@/lib/stripe';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const body      = await req.text();
  const signature = req.headers.get('stripe-signature');

  if (!signature) {
    return new Response('署名がありません', { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch {
    return new Response('署名の検証に失敗しました', { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session  = event.data.object as Stripe.Checkout.Session;
      const userId   = session.metadata?.userId;
      const planName = session.metadata?.plan ?? 'FREE';
      if (userId) {
        await prisma.user.update({
          where: { id: userId },
          data:  { plan: planName as 'FREE' | 'STARTER' | 'PRO' | 'TEAM' },
        });
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object as Stripe.Subscription;
      const priceId = subscription.items.data[0]?.price.id ?? '';
      const plan    = planFromPriceId(priceId);
      const user    = await prisma.user.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { plan: plan as 'FREE' | 'STARTER' | 'PRO' | 'TEAM' },
        });
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object as Stripe.Subscription;
      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: subscription.customer as string },
      });
      if (user) {
        await prisma.user.update({
          where: { id: user.id },
          data:  { plan: 'FREE' },
        });
      }
      break;
    }
  }

  return new Response('OK', { status: 200 });
}
