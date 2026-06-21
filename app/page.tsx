import Link from 'next/link';
import { PLANS, FREE_PLAN } from '@/lib/plans';

const STEPS = [
  { n: 1, label: 'ジャンル決定',     icon: '🎭', desc: 'AIが嗜好を聞いてジャンル・サブジャンルを提案' },
  { n: 2, label: 'キャラクター設計', icon: '👤', desc: '欠乏・欲求・弱点・アークを対話形式で設定' },
  { n: 3, label: '舞台・世界観',     icon: '🌍', desc: '時代・場所・世界のルールを深掘り' },
  { n: 4, label: 'コンフリクト設計', icon: '⚔️',  desc: '目標と障害を三幕構成に自動分類' },
  { n: 5, label: 'プロット生成',     icon: '📝', desc: '感情曲線付きのプロット概要を一括生成' },
  { n: 6, label: 'プロット修正',     icon: '✏️',  desc: '自然言語で指示してAIがその場で修正' },
  { n: 7, label: '章構成設計',       icon: '📋', desc: 'シーンタイプ・テンポ・文字数を章ごとに最適化' },
  { n: 8, label: '執筆 → 添削',     icon: '✍️',  desc: 'ストリーミング生成 + 5軸採点レポート' },
  { n: 9, label: '全章完結まで',     icon: '🏆', desc: '前章要約を自動注入しながら繰り返し' },
];

const FEATURES = [
  { icon: '🔒', title: 'SHA-256 著作権証明', desc: '章完了のたびにハッシュ＋HMAC署名でタイムスタンプ証明を自動生成。INSERT-onlyで改ざん不可。' },
  { icon: '🔍', title: '類似度スキャン', desc: 'Winnowingフィンガープリントでサービス内作品との類似度（Jaccard係数）を可視化。CLEAN/WARNING/FLAGGED/CRITICALで判定。' },
  { icon: '💧', title: 'ウォーターマーク', desc: 'エクスポート時にゼロ幅文字でユーザーIDを埋め込み（同意取得後）。証明IDをフッターに付与。' },
];

type PlanRow = {
  key: string;
  label: string;
  price: string;
  projects: string;
  tokens: string;
  features: string[];
  highlight: boolean;
  cta: string;
};

const PLAN_ROWS: PlanRow[] = [
  {
    key: 'free',
    label: FREE_PLAN.label,
    price: '無料',
    projects: `${FREE_PLAN.projectLimit}件`,
    tokens: `${FREE_PLAN.tokensPerMonth.toLocaleString()}トークン/月`,
    features: ['ジャンル選択・構成生成', '著作権証明 1件/月'],
    highlight: false,
    cta: '無料で始める',
  },
  {
    key: 'starter',
    label: PLANS.STARTER.label,
    price: `¥${PLANS.STARTER.monthlyPrice.toLocaleString()}/月`,
    projects: `${PLANS.STARTER.projectLimit}件`,
    tokens: `${PLANS.STARTER.tokensPerMonth.toLocaleString()}トークン/月`,
    features: ['執筆支援・文章添削', '著作権証明 無制限', 'Markdown / TXTエクスポート'],
    highlight: false,
    cta: '始める',
  },
  {
    key: 'pro',
    label: PLANS.PRO.label,
    price: `¥${PLANS.PRO.monthlyPrice.toLocaleString()}/月`,
    projects: '無制限',
    tokens: `${PLANS.PRO.tokensPerMonth.toLocaleString()}トークン/月`,
    features: ['全機能', 'DOCX / PDFエクスポート', '盗用チェック', 'ウォーターマーク埋め込み'],
    highlight: true,
    cta: 'Proを始める',
  },
  {
    key: 'team',
    label: PLANS.TEAM.label,
    price: `¥${PLANS.TEAM.monthlyPrice.toLocaleString()}/人・月`,
    projects: '無制限',
    tokens: `${(PLANS.TEAM.tokensPerMonth / 1_000_000).toLocaleString()}Mトークン/人・月`,
    features: ['Pro機能すべて', '共有プロジェクト', '管理者機能'],
    highlight: false,
    cta: 'お問い合わせ',
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      {/* Hero */}
      <section className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 px-6 py-24 text-center">
        <p className="mb-4 inline-block rounded-full bg-indigo-100 px-4 py-1 text-sm font-medium text-indigo-700">
          AI先行・人間確定モデル
        </p>
        <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight md:text-6xl">
          小説制作<br />
          <span className="text-indigo-600">サポートエージェント</span>
        </h1>
        <p className="mx-auto mb-10 max-w-2xl text-lg text-gray-600 leading-relaxed">
          ジャンル選択からキャラクター設計・プロット生成・執筆・添削・著作権証明まで
          一気通貫でサポート。AIが先行して案を生成し、あなたが確認・修正する。
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="/projects/new"
            className="rounded-2xl bg-indigo-600 px-8 py-4 text-lg font-bold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition"
          >
            無料で書き始める
          </Link>
          <Link
            href="/projects"
            className="rounded-2xl border-2 border-indigo-200 bg-white px-8 py-4 text-lg font-bold text-indigo-600 hover:border-indigo-400 transition"
          >
            プロジェクト一覧
          </Link>
        </div>
      </section>

      {/* 9ステップフロー */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-2 text-center text-3xl font-bold">9ステップで完結まで</h2>
        <p className="mb-12 text-center text-gray-500">すべてのステップでAIが初期案を先行生成。いつでも前のステップに戻って修正できます。</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {STEPS.map(s => (
            <div key={s.n} className="flex gap-4 rounded-xl border border-gray-100 bg-gray-50 p-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-lg font-bold text-white">
                {s.n}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{s.icon} {s.label}</p>
                <p className="mt-0.5 text-sm text-gray-500">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 著作権保護機能 */}
      <section className="bg-gray-900 px-6 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="mb-3 text-3xl font-bold">3層の著作権保護機能</h2>
          <p className="mb-12 text-gray-400">
            「著作権証明の補助ツール」として提供。法的効力の保証はしませんが、証拠保全の強力な手助けになります。
          </p>
          <div className="grid gap-6 sm:grid-cols-3">
            {FEATURES.map(f => (
              <div key={f.title} className="rounded-xl border border-gray-700 bg-gray-800 p-6 text-left">
                <div className="mb-3 text-3xl">{f.icon}</div>
                <h3 className="mb-2 font-bold text-white">{f.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* プラン比較 */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <h2 className="mb-2 text-center text-3xl font-bold">プラン</h2>
        <p className="mb-12 text-center text-gray-500">トークン超過分は ¥0.5 / 1,000トークンの従量課金</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_ROWS.map(plan => (
            <div
              key={plan.key}
              className={`relative flex flex-col rounded-2xl border p-6 ${
                plan.highlight
                  ? 'border-indigo-500 bg-indigo-50 shadow-lg shadow-indigo-100'
                  : 'border-gray-200 bg-white'
              }`}
            >
              {plan.highlight && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-3 py-0.5 text-xs font-bold text-white">
                  おすすめ
                </span>
              )}
              <h3 className="mb-1 text-lg font-bold">{plan.label}</h3>
              <p className="mb-4 text-2xl font-extrabold text-indigo-600">{plan.price}</p>
              <ul className="mb-6 flex-1 space-y-2 text-sm text-gray-600">
                <li>📁 プロジェクト: {plan.projects}</li>
                <li>🤖 {plan.tokens}</li>
                {plan.features.map(f => <li key={f}>✓ {f}</li>)}
              </ul>
              <Link
                href="/projects/new"
                className={`w-full rounded-xl py-2.5 text-center text-sm font-bold transition ${
                  plan.highlight
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'border border-gray-300 text-gray-700 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* フッター */}
      <footer className="border-t border-gray-100 bg-gray-50 px-6 py-10 text-center text-sm text-gray-400">
        <div className="mb-4 flex flex-wrap justify-center gap-6">
          <Link href="/legal/terms"  className="hover:text-gray-700">利用規約・著作権</Link>
          <Link href="/legal/privacy" className="hover:text-gray-700">プライバシーポリシー</Link>
          <Link href="/projects"     className="hover:text-gray-700">プロジェクト一覧</Link>
          <Link href="/settings"     className="hover:text-gray-700">設定・課金</Link>
        </div>
        <p>© {new Date().getFullYear()} NovelAgent — 著作権証明は法的効力を保証するものではありません</p>
      </footer>
    </main>
  );
}
