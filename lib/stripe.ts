import Stripe from 'stripe';

// 遅延初期化：ビルド時に環境変数がなくてもクラッシュしない
let _stripe: Stripe | null = null;
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY が設定されていません');
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-05-27.dahlia',
    });
  }
  return _stripe;
}

// サーバー側で price_id → Plan enum へのマッピングに使う
export const STRIPE_PRICE_IDS = {
  STARTER: process.env.STRIPE_PRICE_STARTER ?? '',
  PRO:     process.env.STRIPE_PRICE_PRO     ?? '',
  TEAM:    process.env.STRIPE_PRICE_TEAM    ?? '',
} as const;

export function planFromPriceId(priceId: string): string {
  for (const [plan, id] of Object.entries(STRIPE_PRICE_IDS)) {
    if (id && id === priceId) return plan;
  }
  return 'FREE';
}
