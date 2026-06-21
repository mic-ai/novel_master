// クライアント・サーバー両方から参照できるプラン定数
// Stripe SDK への依存なし

export const PLANS = {
  STARTER: {
    label:          'スターター',
    monthlyPrice:   980,
    projectLimit:   20,
    tokensPerMonth: 500_000,
  },
  PRO: {
    label:          'プロ',
    monthlyPrice:   2980,
    projectLimit:   -1,
    tokensPerMonth: 2_000_000,
  },
  TEAM: {
    label:          'チーム',
    monthlyPrice:   9800,
    projectLimit:   -1,
    tokensPerMonth: 10_000_000,
  },
} as const;

export const FREE_PLAN = {
  label:          '無料',
  projectLimit:   3,
  tokensPerMonth: 50_000,
} as const;
