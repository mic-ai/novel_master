'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { PLANS, FREE_PLAN } from '@/lib/plans';

const ALL_PLANS = [
  { key: 'FREE',    label: FREE_PLAN.label,        desc: `プロジェクト${FREE_PLAN.projectLimit}件・${(FREE_PLAN.tokensPerMonth / 10000)}万トークン/月` },
  { key: 'STARTER', label: PLANS.STARTER.label,    desc: `プロジェクト${PLANS.STARTER.projectLimit}件・${(PLANS.STARTER.tokensPerMonth / 10000)}万トークン/月` },
  { key: 'PRO',     label: PLANS.PRO.label,         desc: `プロジェクト無制限・${(PLANS.PRO.tokensPerMonth / 10000)}万トークン/月` },
  { key: 'TEAM',    label: PLANS.TEAM.label,        desc: `プロジェクト無制限・${(PLANS.TEAM.tokensPerMonth / 10000)}万トークン/月` },
] as const;

export default function AdminPlanSwitcher() {
  const { data: session, update } = useSession();
  const [isAdmin, setIsAdmin]     = useState(false);
  const [loading, setLoading]     = useState<string | null>(null);
  const [message, setMessage]     = useState('');

  useEffect(() => {
    fetch('/api/admin/set-plan')
      .then((r) => r.json() as Promise<{ isAdmin: boolean }>)
      .then((d) => setIsAdmin(d.isAdmin))
      .catch(() => {});
  }, []);

  if (!isAdmin) return null;

  const currentPlan = session?.user?.plan ?? 'FREE';

  const handleSetPlan = async (plan: string) => {
    setLoading(plan);
    setMessage('');
    try {
      const res  = await fetch('/api/admin/set-plan', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ plan }),
      });
      const data = await res.json() as { success?: boolean; error?: string };
      if (data.success) {
        await update({ plan });
        setMessage(`プランを「${ALL_PLANS.find((p) => p.key === plan)?.label}」に変更しました`);
      } else {
        setMessage(data.error ?? 'エラーが発生しました');
      }
    } finally {
      setLoading(null);
    }
  };

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold px-2 py-0.5 bg-amber-200 text-amber-800 rounded-full">管理者</span>
        <h2 className="text-lg font-semibold text-gray-800">テスト用プラン切替</h2>
      </div>
      <p className="text-sm text-gray-600">Stripe を介さずにプランを変更できます（ADMIN_EMAILS に登録された管理者のみ）</p>

      <div className="flex flex-wrap gap-2">
        {ALL_PLANS.map((p) => {
          const isCurrent = p.key === currentPlan;
          return (
            <button
              key={p.key}
              onClick={() => handleSetPlan(p.key)}
              disabled={isCurrent || loading !== null}
              title={p.desc}
              className={`px-4 py-2 rounded-lg text-sm font-medium border-2 transition disabled:cursor-not-allowed ${
                isCurrent
                  ? 'border-amber-500 bg-amber-500 text-white'
                  : 'border-amber-300 bg-white text-amber-700 hover:border-amber-500 hover:bg-amber-50 disabled:opacity-50'
              }`}
            >
              {loading === p.key ? '変更中...' : p.label}
              {isCurrent && ' ✓'}
            </button>
          );
        })}
      </div>

      {message && (
        <p className="text-sm text-amber-800 bg-amber-100 rounded-lg px-4 py-2">{message}</p>
      )}

      <p className="text-xs text-gray-400">
        現在のプラン: <strong>{currentPlan}</strong>　／　ページをリロードするとプラン表示も更新されます
      </p>
    </section>
  );
}
