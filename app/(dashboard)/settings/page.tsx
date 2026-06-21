'use client';

import { useSession } from 'next-auth/react';
import { useState } from 'react';
import Image from 'next/image';
import { PLANS, FREE_PLAN } from '@/lib/plans';

const PLAN_ORDER = ['FREE', 'STARTER', 'PRO', 'TEAM'] as const;

const PLAN_DETAILS = {
  FREE: {
    ...FREE_PLAN,
    color: 'border-gray-200 bg-white',
    badge: 'bg-gray-100 text-gray-600',
  },
  STARTER: {
    ...PLANS.STARTER,
    color: 'border-indigo-200 bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700',
  },
  PRO: {
    ...PLANS.PRO,
    color: 'border-violet-200 bg-violet-50',
    badge: 'bg-violet-100 text-violet-700',
  },
  TEAM: {
    ...PLANS.TEAM,
    color: 'border-amber-200 bg-amber-50',
    badge: 'bg-amber-100 text-amber-700',
  },
} as const;

export default function SettingsPage() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState<string | null>(null);

  const currentPlan = (session?.user?.plan ?? 'FREE') as keyof typeof PLAN_DETAILS;

  const handleUpgrade = async (plan: 'STARTER' | 'PRO' | 'TEAM') => {
    setLoading(plan);
    try {
      const res  = await fetch('/api/billing', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  };

  const handlePortal = async () => {
    setLoading('portal');
    try {
      const res  = await fetch('/api/billing/portal', { method: 'POST' });
      const data = await res.json() as { url?: string };
      if (data.url) window.location.href = data.url;
    } finally {
      setLoading(null);
    }
  };

  if (!session?.user) return null;

  const user = session.user;

  return (
    <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
      <h1 className="text-3xl font-bold text-gray-900">設定</h1>

      {/* アカウント情報 */}
      <section className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">アカウント</h2>
        <div className="flex items-center gap-4">
          {user.image ? (
            <Image
              src={user.image}
              alt={user.name ?? 'ユーザー'}
              width={56}
              height={56}
              className="rounded-full"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xl">
              {(user.name ?? user.email ?? 'U')[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <div className="font-semibold text-gray-900">{user.name ?? '名前未設定'}</div>
            <div className="text-sm text-gray-500">{user.email}</div>
          </div>
          <div className="ml-auto">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${PLAN_DETAILS[currentPlan]?.badge ?? 'bg-gray-100 text-gray-600'}`}>
              {PLAN_DETAILS[currentPlan]?.label ?? currentPlan}
            </span>
          </div>
        </div>
      </section>

      {/* プラン一覧 */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800">プラン</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {PLAN_ORDER.map((plan) => {
            const detail = PLAN_DETAILS[plan];
            const isCurrent = plan === currentPlan;

            return (
              <div
                key={plan}
                className={`rounded-xl border-2 p-5 ${detail.color} ${isCurrent ? 'ring-2 ring-indigo-400 ring-offset-1' : ''}`}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${detail.badge}`}>
                    {detail.label}
                  </span>
                  {isCurrent && (
                    <span className="text-xs text-indigo-600 font-medium">現在のプラン</span>
                  )}
                </div>

                <div className="mb-3">
                  {plan === 'FREE' ? (
                    <div className="text-2xl font-bold text-gray-900">無料</div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-900">
                      ¥{'monthlyPrice' in detail ? detail.monthlyPrice.toLocaleString() : 0}
                      <span className="text-sm font-normal text-gray-500">/月</span>
                    </div>
                  )}
                </div>

                <ul className="text-sm text-gray-600 space-y-1 mb-4">
                  <li>
                    プロジェクト:{' '}
                    {detail.projectLimit === -1 ? '無制限' : `最大${detail.projectLimit}件`}
                  </li>
                  <li>
                    AI生成:{' '}
                    {(detail.tokensPerMonth / 10000).toLocaleString()}万トークン/月
                  </li>
                </ul>

                {!isCurrent && plan !== 'FREE' && (
                  <button
                    onClick={() => handleUpgrade(plan as 'STARTER' | 'PRO' | 'TEAM')}
                    disabled={loading !== null}
                    className="w-full py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition"
                  >
                    {loading === plan ? '処理中...' : 'アップグレード'}
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {currentPlan !== 'FREE' && (
          <div className="text-center pt-2">
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="text-sm text-gray-500 hover:text-gray-700 underline disabled:opacity-50"
            >
              {loading === 'portal' ? '処理中...' : 'サブスクリプションを管理する（Stripe カスタマーポータル）'}
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
