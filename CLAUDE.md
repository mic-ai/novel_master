# 小説制作サポートエージェント — CLAUDE.md

> ClaudeCodeが本プロジェクトを理解・実装するための設定ソース。実装前に必ず読むこと。

---

## 0. プロジェクト概要

**サービス名:** 小説制作サポートエージェント（NovelAgent）  
**目的:** ジャンル決定〜執筆・添削まで一気通貫でサポートするWebサービス。AIが初期案を先行生成し、ユーザーが確認・修正する「AI先行・人間確定」モデル。  
**対象ユーザー:** 小説を書きたい全ての人（初心者〜セミプロ）  
**媒体:** 書籍 / ウェブ小説（カクヨム・小説家になろう等）両対応

---

## 1. 技術スタック

| レイヤー | 採用技術 |
|---|---|
| フロントエンド | Next.js 14 (App Router) + TypeScript + Tailwind CSS |
| UIコンポーネント | shadcn/ui |
| バックエンド | Next.js Route Handlers |
| AIエンジン | Anthropic Claude API (claude-sonnet-4-5) — **WritingAgentはストリーミング必須** |
| DB / ORM | PostgreSQL (Supabase or Railway) + Prisma |
| 認証 | NextAuth.js v5 (Google / GitHub OAuth) |
| 課金 | Stripe (サブスクリプション) |
| ストレージ | Supabase Storage |
| デプロイ | Vercel (フロント) + Railway (DB) |
| 監視 | Sentry + Vercel Analytics |

---

## 2. ユーザーフロー（9ステップ）

```
STEP 1: ジャンル決定          → GenreAdvisorAgent    → projects.genre
STEP 2: キャラクター設定      → CharacterBuilderAgent → characters[]
STEP 3: 背景・舞台設定        → WorldBuilderAgent     → world_settings
STEP 4: 目標とハードル設定    → ConflictDesignerAgent → plot_obstacles[]
STEP 5: プロット生成          → PlotGeneratorAgent    → plot_outline (JSON)
STEP 6: プロット修正          → PlotRefinerAgent      → plot_outline (確定)
STEP 7: 章の構成概要作成      → StructureAgent        → chapter_outlines[]
STEP 8: 章 生成→確認→修正    → WritingAgent          → chapters.content
         └─ 自動評価          → ReviewAgent           → review_reports
STEP 9: 2章〜終章（ループ）   → STEP 7〜8を繰り返す
```

**設計方針:**
- 前ステップの出力が次ステップのコンテキストとして自動引き継ぎ
- STEP 7〜9 は章ごとに繰り返す「執筆ループ」
- 任意のステップに戻って修正できる非線形フロー

---

## 3. ディレクトリ構成

```
novel-agent/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── projects/page.tsx              # プロジェクト一覧
│   │   ├── projects/new/page.tsx          # 新規作成ウィザード (STEP 1〜4)
│   │   ├── editor/[id]/structure/page.tsx # 構成エディタ (STEP 5〜7)
│   │   ├── editor/[id]/write/[ch]/page.tsx# 執筆エディタ (STEP 8〜9)
│   │   └── editor/[id]/export/page.tsx
│   └── api/
│       ├── agent/ genre/ character/ world/ conflict/ plot/ structure/ write/ review/
│       ├── projects/ + [id]/
│       ├── copyright/ export/ + scan/
│       └── webhooks/stripe/
├── components/
│   ├── editor/
│   │   ├── WritingEditor.tsx   AiAssistantPanel.tsx   ProjectNav.tsx
│   │   ├── WordCountBar.tsx    TempoIndicator.tsx      ForeshadowingReminder.tsx
│   ├── wizard/
│   │   ├── GenreSelector.tsx   CharacterBuilder.tsx
│   │   ├── WorldBuilder.tsx    ConflictDesigner.tsx
│   └── copyright/
│       ├── CopyrightDashboard.tsx   ExportModal.tsx   ScanResult.tsx
├── lib/
│   ├── agent/utils/
│   │   ├── get-genre-context.ts   # GENRE_RULES参照ユーティリティ
│   │   └── tempo-planner.ts       # テンポ計画生成
│   ├── prompts/
│   │   ├── genre-rules.ts         # ★ GENRE_RULES定数（単一ソース）
│   │   ├── common-rules.ts        # COMMON_RULES定数
│   │   └── templates/
│   │       ├── plot-generator.ts  writing-agent.ts  review-agent.ts
│   ├── copyright/
│   │   ├── proof.ts   fingerprint.ts   watermark.ts   legal-notices.ts
│   └── db/prisma.ts
└── prisma/schema.prisma
```

---

## 4. データモデル

→ 実ファイル: `prisma/schema.prisma`

**主要モデル一覧:**

| モデル | 主なフィールド |
|---|---|
| `User` | plan (FREE/STARTER/PRO/TEAM), stripeCustomerId |
| `Project` | genre, media, genreRulesSnapshot, tempoPlan, plotOutline, worldSettings |
| `Character` | role, lack, want, weakness, arc, arcStart, arcEnd, arcProgress |
| `Chapter` | content, summary（500字要約）, reviewReport, emotionScore |
| `ChapterOutline` | sceneType, tempoRole, foreshadowingIds, scenes[] |
| `Foreshadowing` | plantedChapter, resolveChapter, isFake |
| `CopyrightRecord` | contentHash, signature, prevHash（**INSERT-only**） |
| `TextFingerprint` | fingerprints（Winnowing k-gram）, kgramSize, windowSize |
| `PlagiarismScanLog` | scanType, similarity, status |
| `ExportRecord` | format, watermarkId, signedUrl |
| `AiSession` | agentType, messages |
| `UsageLog` | userId, tokens, feature |

**補足:** `Project.copyrightRecords` / `fingerprints` / `plagiarismScans` / `exportRecords` のリレーションを Project モデルに追加済み。

---

## 5. GENRE_RULES（ジャンルルール）

→ 実ファイル: `lib/prompts/genre-rules.ts`  
→ ユーティリティ: `lib/agent/utils/get-genre-context.ts`

**原則: 全エージェントはこのファイルのみを参照する。数値を直接ハードコーディングしない。**

対象ジャンル: `romance` / `mystery` / `fantasy` / `sf` / `horror`

各ジャンルが持つプロパティ:
- `label` / `core_principle` / `keywords`
- `total_words` — 媒体別・規模別の文字数範囲
- `parts` — パート構成と比率（書籍用）
- `chapter_words` — シーンタイプ別の1章文字数目安 (`standard` / `emotional_peak` / `battle` 等)
- `chapter_ending_rules` — 章末の締め方ルール
- `pov_rules` — 視点人物ルール
- `tempo_rules` — 緊張・弛緩の周期ルール
- `review_extra` — ジャンル固有の採点項目
- `*_specific` — ジャンル固有のルール群

**ユーティリティ関数:**
- `getGenreContext(genre, media)` — エージェント用に必要な情報をまとめて返す
- `getSceneWordRange(genre, media, sceneType)` — シーンタイプ別の文字数範囲（フォールバック: `standard`）

**共通ルール:** `lib/prompts/common-rules.ts` の `COMMON_RULES`
- `writing_rubric` — 5項目（show_not_tell / pov_consistency / sentence_rhythm / character_arc / foreshadowing）
- `scene_break` — `◆◆◆` / `翌日——` / 最大3シーン/章
- `scene_types` — 11種類のシーンタイプ

---

## 6. エージェント設計

→ プロンプトテンプレート: `lib/prompts/templates/`

### GenreAdvisorAgent (`app/api/agent/genre/route.ts`)
入力: ユーザーの嗜好・希望  
出力: 推奨ジャンル・サブジャンルの提案

### CharacterBuilderAgent (`app/api/agent/character/route.ts`)
入力: genre / ユーザーの要望  
出力: キャラクター案（role / lack / want / weakness / arc）

### WorldBuilderAgent (`app/api/agent/world/route.ts`)
入力: genre / characters  
出力: 世界観・舞台設定

### ConflictDesignerAgent (`app/api/agent/conflict/route.ts`)
入力: genre / characters / worldSettings  
出力: 主人公の目標と障害リスト

### PlotGeneratorAgent (`app/api/agent/plot/route.ts`)
入力: genre / media / targetWords / characters / worldSettings / goal / obstacles  
出力: `plot_outline` JSON  
テンプレート: `buildPlotGeneratorPrompt(ctx)` in `lib/prompts/templates/plot-generator.ts`

### StructureAgent (`app/api/agent/structure/route.ts`)
入力: projectId / chapterNumber  
出力: `ChapterOutline`（sceneType / scenes[] / foreshadowingIds）

### WritingAgent (`app/api/agent/write/route.ts`) ★ストリーミング必須
入力: projectId / chapterNumber / sceneIndex  
DB参照: project(characters, foreshadowing) + chapterOutline + prevChapter.summary  
出力: `ReadableStream` (chunked text / `Transfer-Encoding: chunked`)  
モデル: `claude-sonnet-4-5` / `max_tokens: 4096` / `stream: true`  
テンプレート: `buildWritingPrompt(ctx)` in `lib/prompts/templates/writing-agent.ts`

### ReviewAgent (`app/api/agent/review/route.ts`)
入力: genre / media / chapterContent / genreRulesSnapshot / foreshadowingToPlant  
採点: `COMMON_RULES.writing_rubric` (5項目) + ジャンル別 `review_extra`  
出力 JSON: `total_score` / `items[]` / `chapter_ending_check` / `foreshadowing_check` / `overall_feedback`  
テンプレート: `buildReviewPrompt(ctx)` in `lib/prompts/templates/review-agent.ts`

---

## 7. テンポ管理

→ 実ファイル: `lib/agent/utils/tempo-planner.ts`

`generateTempoPlan(genre, media, totalChapters)` で全章の緊張・弛緩計画を生成。  
`Project.tempoPlan` に保存し、`TempoIndicator` コンポーネントが参照する。

| ジャンル | サイクル |
|---|---|
| fantasy / book | 6章に1回バトル → 直後1章は弛緩 |
| romance / web | 5話に1回甘いシーン |
| horror | 4章に1回恐怖ピーク → 直後1章は弛緩 |
| mystery | 4章に1回新事実発覚 |
| sf / その他 | neutral を基本に手動調整 |

---

## 8. 著作権保護機能

→ 実ファイル: `lib/copyright/`

**3層構造:**

| Layer | 目的 | ファイル |
|---|---|---|
| 1 証明 (Proof) | SHA-256ハッシュ + HMAC署名 + チェーン構造で「誰が・いつ書いたか」を記録 | `proof.ts` |
| 2 検出 (Detection) | Winnowingフィンガープリントで類似度（Jaccard係数）を算出 | `fingerprint.ts` |
| 3 管理 (Control) | ゼロ幅文字ウォーターマーク埋め込み + 著作権フッター | `watermark.ts` |

**類似度しきい値（`SIMILARITY_THRESHOLDS`）:**
- `CLEAN` ≤0.15 / `WARNING` ≤0.40 / `FLAGGED` ≤0.70 / `CRITICAL` >0.70

**UIコンポーネント:**
- `CopyrightDashboard.tsx` — 証明レコード一覧・盗用チェック・PDFダウンロード
- `ExportModal.tsx` — ウォーターマーク / フッター / 証明ID の埋め込みオプション
- `ScanResult.tsx` — しきい値別の結果表示

**重要制約:**
- `CopyrightRecord` テーブルは INSERT-only（`update` / `delete` 禁止、証拠保全のため）
- `COPYRIGHT_SIGNING_KEY` と `CONTENT_ENCRYPTION_KEY` は別の値を使う
- ウォーターマーク埋め込みはユーザーの明示的な同意後のみ
- 宣伝文句: 「著作権証明の補助ツール」○ / 「完全な著作権保護・法的効力を保証」✗

**法的注意事項:** `lib/copyright/legal-notices.ts` 参照（法務レビュー必須）

---

## 9. コーディングルール

```
✗ 数値ハードコーディング禁止
  × const MIN_WORDS = 3000
  ○ const { min } = getSceneWordRange(genre, media, sceneType)

✗ プロンプト直書き禁止
  × const prompt = `あなたは恋愛小説の...`
  ○ const prompt = buildWritingPrompt(ctx)

✗ DB直接操作禁止（Prisma経由のみ）
  × db.query('SELECT ...')
  ○ prisma.project.findUnique({ ... })

✗ APIキーハードコーディング禁止
  × new Anthropic({ apiKey: 'sk-ant-...' })
  ○ new Anthropic()  // ANTHROPIC_API_KEY を自動参照

✗ WritingAgent のストリーミング無効化禁止
  × client.messages.create({ stream: false })
  ○ client.messages.create({ stream: true })

✓ プロジェクト作成時に genreRulesSnapshot を保存
  → 後からルール改訂しても既存作品に影響させない
  genreRulesSnapshot: GENRE_RULES[genre]

✓ TypeScript strict モード必須
  tsconfig.json: { "strict": true }

✓ Server / Client コンポーネントを明示
  状態・イベント不要 → 'use client' 不要
  状態・イベントが必要なものにのみ 'use client' を付与
```

**package.json scripts:**
```json
{
  "scripts": {
    "db:migrate":  "prisma migrate dev",
    "db:generate": "prisma generate",
    "db:studio":   "prisma studio",
    "lint":        "next lint",
    "type-check":  "tsc --noEmit",
    "test":        "vitest",
    "test:e2e":    "playwright test"
  }
}
```

---

## 10. 環境変数（`.env.local`）

```bash
# Anthropic
ANTHROPIC_API_KEY=sk-ant-...

# Database
DATABASE_URL=postgresql://...

# Auth（NextAuth v5 形式）— 変数名は AUTH_ プレフィックス統一
AUTH_SECRET=...
NEXTAUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=...          AUTH_GOOGLE_SECRET=...
AUTH_GITHUB_ID=...          AUTH_GITHUB_SECRET=...

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_STARTER=price_...   # Stripe ダッシュボードで作成した月額プランのID
STRIPE_PRICE_PRO=price_...
STRIPE_PRICE_TEAM=price_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...

# 著作権保護（openssl rand -hex 32 で生成）
COPYRIGHT_SIGNING_KEY=...
CONTENT_ENCRYPTION_KEY=...

# Sentry（省略可能 — 未設定時は監視無効）
NEXT_PUBLIC_SENTRY_DSN=https://...@sentry.io/...
SENTRY_ORG=your-org
SENTRY_PROJECT=novel-agent
SENTRY_AUTH_TOKEN=sntrys_...  # Source Maps アップロード用（CI/Vercel のみ必要）
```

---

## 11. 実装状況 / TODO

> **Priority 1〜9 + レート制限・e2e拡充 すべて完了（2026-06-14）。テスト数: 81（Vitest ユニット）。**

### ✅ Priority 2 完了（2026-06-12）

| カテゴリ | 完了ファイル |
|---|---|
| API Routes | `app/api/agent/write/route.ts`（WritingAgent ストリーミング） |
| API Routes | `app/api/agent/review/route.ts`（ReviewAgent） |
| API Routes | `app/api/chapters/route.ts`（章 GET/POST/PATCH） |
| ページ | `app/(dashboard)/editor/[id]/write/[ch]/page.tsx`（3ペインエディタ） |
| コンポーネント | `components/editor/WritingEditor.tsx`（明朝体テキストエリア・自動リサイズ） |
| コンポーネント | `components/editor/WordCountBar.tsx`（targetMin/Max に対応した進捗バー） |
| コンポーネント | `components/editor/TempoIndicator.tsx`（緊張・弛緩インジケーター） |
| コンポーネント | `components/editor/ForeshadowingReminder.tsx`（伏線配置リマインダー） |
| コンポーネント | `components/editor/AiAssistantPanel.tsx`（生成・添削・結果表示） |

`next build` 成功確認済み（DB未接続でのprerender errorは想定内）。

**執筆ループの動作:**
1. 左ペイン: 全章ナビゲーション
2. 中央ペイン: TempoIndicator + WordCountBar + 明朝体エディタ（1.5秒自動保存）
3. 右ペイン: 章情報・伏線リマインダー・AI生成ボタン（ストリーミング）・添削ボタン・採点結果

---

### ✅ Priority 1 完了（2026-06-10）

| カテゴリ | 完了ファイル |
|---|---|
| DB/ORM | `prisma/schema.prisma` `lib/db/prisma.ts` |
| プロンプト基盤 | `lib/prompts/genre-rules.ts` `common-rules.ts` `templates/plot-generator.ts` `writing-agent.ts` `review-agent.ts` |
| ユーティリティ | `lib/agent/utils/get-genre-context.ts` `tempo-planner.ts` |
| API Routes | `agent/genre` `agent/character` `agent/world` `agent/conflict` `agent/plot` `agent/structure` `projects` `projects/[id]` |
| ページ | `projects/page.tsx` `projects/new/page.tsx` `editor/[id]/structure/page.tsx` |
| コンポーネント | `GenreSelector` `CharacterBuilder` `WorldBuilder` `ConflictDesigner` |

`next build` 成功確認済み。ローカル実行には `DATABASE_URL` の設定が必要。

### ✅ Priority 3 完了（2026-06-12）

| カテゴリ | 完了ファイル |
|---|---|
| 認証 | `lib/auth.config.ts` `lib/auth.ts` `middleware.ts` `types/next-auth.d.ts` |
| 認証 | `app/api/auth/[...nextauth]/route.ts` `app/(auth)/login/page.tsx` `app/(auth)/layout.tsx` |
| 認証 | `components/SessionProvider.tsx` `app/layout.tsx`（auth統合） `app/(dashboard)/layout.tsx` |
| 課金 | `lib/stripe.ts`（lazy init） `lib/plans.ts`（client-safe） |
| 課金 | `app/api/billing/route.ts` `app/api/billing/portal/route.ts` `app/api/webhooks/stripe/route.ts` |
| 課金 | `app/(dashboard)/settings/page.tsx`（プラン管理UI） |
| 認証統合 | 全エージェントAPIルート + `app/api/projects/route.ts` + `app/api/projects/[id]/route.ts` |

`next build` 成功確認済み（`npm run build` = `scripts/build.cjs` 経由）。

**注意:** ローカルビルドは `npm run build` で実行する（`scripts/build.cjs` が EIO patch を自動適用）。Windows/WSL環境でNTFSパスの`rmdir`がEIOを返す問題を `scripts/patch-fs-eio.cjs` でサイレント回避。Vercelデプロイは通常の `next build` が使われるため問題なし。

---

### ✅ Priority 4 完了（2026-06-12）

| カテゴリ | 完了ファイル |
|---|---|
| 著作権証明 | `lib/copyright/proof.ts`（SHA-256 + HMAC署名 + チェーン） |
| ウォーターマーク | `lib/copyright/watermark.ts`（ゼロ幅文字 + フッター） |
| 類似度検出 | `lib/copyright/fingerprint.ts`（Winnowing + Jaccard） |
| 法的注意 | `lib/copyright/legal-notices.ts` |
| API | `app/api/copyright/records/route.ts`（GET/POST/PATCH） |
| API | `app/api/copyright/export/route.ts`（フッター・ウォーターマーク付きエクスポート） |
| API | `app/api/copyright/scan/route.ts`（内部類似度スキャン） |
| コンポーネント | `components/copyright/CopyrightDashboard.tsx` |
| コンポーネント | `components/copyright/ExportModal.tsx` |
| コンポーネント | `components/copyright/ScanResult.tsx` |
| ページ | `app/(dashboard)/editor/[id]/export/page.tsx` |
| 自動証明 | `app/api/chapters/route.ts` PATCH — 章完了時に`createCopyrightProof`を自動呼び出し |

---

### ✅ Priority 5 完了（2026-06-12）

**Vitest ユニットテスト（37テスト全通過）:**
| ファイル | テスト数 |
|---|---|
| `__tests__/copyright/fingerprint.test.ts` | 14 |
| `__tests__/copyright/watermark.test.ts` | 10 |
| `__tests__/agents/genre-rules.test.ts` | 7 |
| `__tests__/agents/tempo-planner.test.ts` | 7 |

実行: `npm test`

**Playwright e2eテスト:**
| ファイル | 内容 |
|---|---|
| `e2e/01-auth.spec.ts` | 認証リダイレクト検証（認証不要） |
| `e2e/02-wizard.spec.ts` | STEP 1-4 ウィザード（`E2E_AUTH_COOKIE` 必要） |
| `e2e/03-editor.spec.ts` | STEP 7-9 エディタ + 著作権ページ（`E2E_AUTH_COOKIE` 必要） |
| `e2e/04-api-health.spec.ts` | API 401/200 スモークテスト（認証不要） |

実行: `npm run test:e2e`（`next dev` が起動済みであること）

**Sentry エラー監視:**
- `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`
- `instrumentation.ts` — `NEXT_RUNTIME` に応じてサーバー/エッジを初期化
- `app/error.tsx` / `app/global-error.tsx` — `Sentry.captureException` でキャッチ
- `next.config.mjs` — `NEXT_PUBLIC_SENTRY_DSN` 設定時のみ `withSentryConfig` を適用
- 未設定時はノーオペレーション（SDK は silent に無効化）

---

### ✅ Priority 8 完了（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| エージェント | `lib/prompts/templates/inline-edit-agent.ts`（書き直す/膨らませる） |
| API | `app/api/agent/inline-edit/route.ts` |
| UI | `components/editor/WritingEditor.tsx` — テキスト選択フローティングメニュー（書き直す/膨らませる/削除） |
| エージェント | `lib/prompts/templates/continuation-agent.ts` |
| API | `app/api/agent/continue/route.ts`（ストリーミング） |
| UI | `write/[ch]/page.tsx` — 30秒 idle タイマー + サジェストバナー（採用/別の案/閉じる） |
| 統合 | `app/api/chapters/route.ts` PATCH — ConsistencyAgent バックグラウンド fire-and-forget |
| パッケージ | `package.json` に `docx ^9.5.1` 追加 |
| API | `app/api/copyright/export/route.ts` — DOCX バイナリ生成対応（動的インポート） |
| UI | `components/copyright/ExportModal.tsx` — `.docx` 形式オプション追加 |
| 型 | `types/docx.d.ts` — docx スタブ型宣言（npm install 前のビルド用） |
| テスト | `__tests__/agents/inline-edit-agent.test.ts`（8テスト） |
| テスト | `__tests__/agents/continuation-agent.test.ts`（6テスト） |

`tsc --noEmit` エラーゼロ確認済み。`npm install` 後に DOCX エクスポートが有効化。

---

### ✅ Priority 9 完了（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| ユーティリティ | `lib/agent/utils/tempo-warnings.ts`（`getTempoWarnings`関数） |
| UI | `write/[ch]/page.tsx` — テンポ警告バナー（amber/red）+ `PartProgressBar` 統合 |
| コンポーネント | `components/editor/PartProgressBar.tsx`（パート別進捗バー） |
| エージェント | `lib/prompts/templates/plot-generator.ts` — `variantHint?` パラメータ追加 |
| API | `app/api/agent/plot/variants/route.ts`（3バリエーション並列生成） |
| UI | `structure/page.tsx` — 「🎲 3パターン比較」ボタン + 比較パネル（採用機能付き） |
| 認証 | `prisma/schema.prisma` — `User.password String?` フィールド追加 |
| ユーティリティ | `lib/db/password.ts`（Node.js crypto による scrypt ハッシュ） |
| 認証 | `lib/auth.ts` — Credentials provider 追加（メール+パスワードサインイン） |
| API | `app/api/auth/register/route.ts`（新規登録エンドポイント） |
| コンポーネント | `components/auth/CredentialsLoginForm.tsx`（メール/パスワードフォーム） |
| ページ | `app/(auth)/register/page.tsx`（新規登録ページ） |
| ページ | `app/(auth)/login/page.tsx` — Credentials フォームと「登録完了」通知を追加 |
| テスト | `__tests__/agents/tempo-warnings.test.ts`（7テスト） |
| テスト | `__tests__/agents/plot-variants.test.ts`（3テスト） |

**テンポ警告ルール（`getTempoWarnings`）:**
- romance/web: `tempo_rules.web.sweet_scene_interval`（既定5）話以内に `romance`/`sweet_scene` なし → WARNING
- fantasy/book: `tempo_rules.book.battle_interval.max`（既定7）章以上 `battle` なし → WARNING
- horror/book: 現章が `horror_peak` かつ前章が安心シーン (`daily`/`slow_burn`/`daily_scene`) 以外 → ERROR

**メール+パスワード認証:**
- `lib/db/password.ts` の `hashPassword`/`verifyPassword` は Node.js 組み込み `crypto.scryptSync` を使用（外部依存なし）
- `lib/auth.ts` の Credentials provider は Node.js 環境でのみ動作（Edgeミドルウェアは `authMiddlewareConfig` を使用し providers なし）
- スキーマ変更後は `npx prisma migrate dev --name add-user-password` の実行が必要

**テスト数: 71 → 81（+10）**

---

### ✅ プラン別 API レート制限 完了（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| ユーティリティ | `lib/plan-limits.ts`（`checkMonthlyTokens` / `checkProjectLimit` / `tokenLimitResponse` / `projectLimitResponse`） |
| API統合 | `app/api/agent/write/route.ts` — 月間トークン上限チェック追加 |
| API統合 | `app/api/agent/plot/route.ts` — 月間トークン上限チェック追加 |
| API統合 | `app/api/agent/plot/variants/route.ts` — 月間トークン上限チェック追加 |
| API統合 | `app/api/projects/route.ts` POST — プロジェクト数上限チェック追加 |

**レート制限の仕組み:**
- `checkMonthlyTokens`: `UsageLog` を月初から集計（`prisma.usageLog.aggregate`）してプランの `tokensPerMonth` と比較
- `checkProjectLimit`: `Project.count` でプロジェクト数を確認（PRO/TEAM は `-1` で無制限）
- 超過時は 429 + 日本語エラーメッセージ（アップグレード案内付き）

---

### ✅ Vercel Analytics 追加（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| パッケージ | `@vercel/analytics` を `npm install` で追加 |
| 統合 | `app/layout.tsx` — `<Analytics />` コンポーネントを `<body>` 末尾に追加 |

Vercel 環境でのみ計測が有効化される（ローカル `npm run dev` では無効）。

---

### ✅ ビルド・型エラー修正（2026-06-14）

| ファイル | 修正内容 |
|---|---|
| `app/api/agent/plot/variants/route.ts` | `export const VARIANT_LABELS` → `const VARIANT_LABELS`（Next.js Route で許可されない export 名） |
| `.eslintrc.json` | `@typescript-eslint/no-unused-vars` に `varsIgnorePattern: "^_"` 追加（`_cs` 等の意図的未使用変数を許容） |
| `__tests__/agents/tempo-warnings.test.ts` | `warnings[0]` → `warnings[0]!`（strict モード TS2532 対応） |

`npm run type-check` エラーゼロ・`npm test` 81テスト全通過・`npm run build` 成功を確認済み（2026-06-14）。

---

### ✅ e2e テスト拡充 完了（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| e2eテスト | `e2e/05-new-features.spec.ts`（P6〜P9 新機能スモークテスト） |

**テスト内容:**
- 新規 API エンドポイント 8件の 401 確認（`/api/agent/continue`・`/api/agent/plot/variants`・`/api/agent/consistency`・`/api/agent/inline-edit`・`/api/agent/summarize`・`/api/foreshadowing`・`/api/characters/[id]`・`/api/agent/refine`）
- `POST /api/auth/register` 入力バリデーション（空ボディ 400・短パスワード 400）
- 新規公開ページ表示確認（`/register` 200・`/privacy` 200）
- 登録/ログインページの UI 要素確認（フォームフィールド・ボタン）
- 新規保護ページの未認証リダイレクト（キャラクター・伏線・著作権）
- 認証済みテスト（`E2E_AUTH_COOKIE` 設定時）: キャラクター管理・伏線ボード3列・著作権ダッシュボード・3パターン比較ボタン

---

### ✅ Priority 7 完了（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| エージェント | `lib/prompts/templates/plot-refiner.ts`（プロット修正プロンプト） |
| API | `app/api/agent/refine/route.ts`（PlotRefinerAgent） |
| UI統合 | `app/(dashboard)/editor/[id]/structure/page.tsx` — 「✏️ プロットを修正」ボタン + テキスト入力 UI |
| ナビゲーション | structure/page.tsx ヘッダーに キャラクター・伏線・著作権リンク追加 |
| ナビゲーション | write/[ch]/page.tsx トップバーに キャラクター・伏線・著作権・出力リンク追加 |
| ページ | `app/page.tsx` — 9ステップ説明・著作権機能紹介・プラン比較表を含む本格LP |
| ページ | `app/(marketing)/privacy/page.tsx` — プライバシーポリシー |
| テスト | `__tests__/agents/plot-refiner.test.ts`（6テスト） |

`tsc --noEmit` エラーゼロ確認済み。

---

### ✅ Priority 6 完了（2026-06-14）

| カテゴリ | 完了ファイル |
|---|---|
| エージェント | `lib/prompts/templates/summarize-agent.ts`（500字要約プロンプト） |
| API | `app/api/agent/summarize/route.ts`（SummarizationAgent） |
| API統合 | `app/api/chapters/route.ts` PATCH — 章完了時に SummarizationAgent を自動呼び出し |
| エージェント | `lib/prompts/templates/consistency-agent.ts`（整合性チェックプロンプト） |
| API | `app/api/agent/consistency/route.ts`（ConsistencyAgent） |
| ページ | `app/(dashboard)/editor/[id]/copyright/page.tsx`（著作権ダッシュボード） |
| ページ | `app/(dashboard)/editor/[id]/export/page.tsx`（エクスポート専用ページに更新） |
| コンポーネント | `components/editor/ExportPageClient.tsx` |
| API | `app/api/characters/[charId]/route.ts`（キャラクター PATCH） |
| コンポーネント | `components/editor/CharacterCard.tsx`（アーク進捗バー・インライン編集） |
| コンポーネント | `components/editor/CharactersClient.tsx` |
| ページ | `app/(dashboard)/editor/[id]/characters/page.tsx`（キャラクター管理） |
| API | `app/api/foreshadowing/route.ts`（GET/POST） |
| API | `app/api/foreshadowing/[fsId]/route.ts`（PATCH/DELETE） |
| コンポーネント | `components/editor/ForeshadowingBoard.tsx`（3列カンバン式） |
| ページ | `app/(dashboard)/editor/[id]/foreshadowing/page.tsx`（伏線ボード） |
| テスト | `__tests__/agents/summarize-agent.test.ts`（7テスト） |
| テスト | `__tests__/agents/consistency-agent.test.ts`（7テスト） |

`tsc --noEmit` エラーゼロ確認済み。

---

## 12. ローカル実機テスト手順

### 必要な環境変数（`.env.local`）

```bash
# 必須
DATABASE_URL=postgresql://postgres:password@localhost:5432/novel_agent
ANTHROPIC_API_KEY=sk-ant-api03-...
AUTH_SECRET=<openssl rand -hex 32>          # ※ NEXTAUTH_SECRET ではなく AUTH_SECRET（v5）
NEXTAUTH_URL=http://localhost:3000
AUTH_GOOGLE_ID=xxx.apps.googleusercontent.com   # ※ GOOGLE_CLIENT_ID ではなく AUTH_GOOGLE_ID（v5）
AUTH_GOOGLE_SECRET=GOCSPX-xxx               # ※ GOOGLE_CLIENT_SECRET ではなく AUTH_GOOGLE_SECRET（v5）
AUTH_GITHUB_ID=Ov23liXXX                   # ※ GITHUB_CLIENT_ID ではなく AUTH_GITHUB_ID（v5）
AUTH_GITHUB_SECRET=xxx                     # ※ GITHUB_CLIENT_SECRET ではなく AUTH_GITHUB_SECRET（v5）
COPYRIGHT_SIGNING_KEY=<openssl rand -hex 32>
CONTENT_ENCRYPTION_KEY=<openssl rand -hex 32>

# 省略可（課金・監視機能が不要な場合）
# STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET / STRIPE_PRICE_* は省略可
# NEXT_PUBLIC_SENTRY_DSN は省略可（未設定でも動作）
```

### 最短セットアップ（Windows + Docker Desktop）

```powershell
# 1. PostgreSQL を Docker で起動（PowerShell）
docker run -d --name novel-pg `
  -e POSTGRES_DB=novel_agent `
  -e POSTGRES_USER=postgres `
  -e POSTGRES_PASSWORD=password `
  -p 5432:5432 postgres:16

# 2. Windows 用 Prisma クライアント生成（初回のみ）
npx prisma generate

# 3. テーブル作成（初回）
$env:DATABASE_URL="postgresql://postgres:password@localhost:5432/novel_agent"
npx prisma migrate dev --name init

# 3b. User.password フィールド追加（P9 以降のスキーマ変更 — 既存 DB がある場合のみ）
npx prisma migrate dev --name add-user-password

# 4. 開発サーバー起動
npm run dev   # → http://localhost:3000
```

**Windows 固有の注意事項:**
- `npm install` は Windows 側で実行すること（Linux sandbox で生成した node_modules は動作しない）
- `prisma generate` も Windows 側で実行すること（`binaryTargets = ["native", "windows"]` が必要）
- `prisma/schema.prisma` の generator に `binaryTargets = ["native", "windows"]` を追加済み
- Prisma に `.env.local` は読まれないため、マイグレーション時は `$env:DATABASE_URL=...` で明示指定

### コマンドリファレンス

```bash
npm run dev            # 開発サーバー
npm run build          # 本番ビルド（EIO patch 適用済み）
npm test               # Vitest ユニットテスト（81テスト）
npm run test:e2e       # Playwright e2e（next dev 起動済みが前提）
npm run type-check     # TypeScript 型検査のみ
npx prisma studio      # DB GUI（ブラウザで確認）
npx prisma migrate dev # スキーマ変更後のマイグレーション
```

### OAuth アプリ設定（Google の場合）

Google Cloud Console → APIとサービス → 認証情報 → OAuth 2.0 クライアントID
- 承認済みの JavaScript 生成元: `http://localhost:3000`
- 承認済みのリダイレクト URI: `http://localhost:3000/api/auth/callback/google`
- OAuth 同意画面 → テストユーザーに使用するGoogleアカウントを登録すること

### OAuth アプリ設定（GitHub の場合）

GitHub → Settings → Developer Settings → OAuth Apps → New OAuth App
- Homepage URL: `http://localhost:3000`
- Authorization callback URL: `http://localhost:3000/api/auth/callback/github`

---

## 13. ClaudeCode への指示テンプレート

```
タスク: [実装するもの]
参照: CLAUDE.md §[セクション番号] + [ファイルパス]
制約:
  - GENRE_RULES のハードコーディング禁止
  - Prisma 経由でのみ DB 操作
  - TypeScript strict モード
完了条件: [ビルド通過 / テスト通過 / 動作確認の条件]
```

---

---

## 14. ローカル実機テスト進捗（2026-06-12）

### 対応済み

| 問題 | 原因 | 対処 |
|---|---|---|
| `prisma generate` が Windows で動かない | sandbox（Linux）で生成したバイナリが Windows 非対応 | `prisma/schema.prisma` の generator に `binaryTargets = ["native", "windows"]` を追加。Windows 側で `npx prisma generate` を再実行 |
| `invalid_client` (Google OAuth 401) | NextAuth v5 の環境変数名が変更 | `.env.local` を `GOOGLE_CLIENT_ID` → `AUTH_GOOGLE_ID`、`GOOGLE_CLIENT_SECRET` → `AUTH_GOOGLE_SECRET` に変更 |
| `Can't reach database server` | PostgreSQL が Linux sandbox 内にあり Windows から到達不可 | Docker Desktop for Windows で PostgreSQL コンテナを起動 |
| `JWEInvalid: Invalid Compact JWE` | PrismaAdapter がデータベースセッションを作成するが、Edge ミドルウェアが JWT を期待 | `auth.config.ts` と `auth.ts` に `session: { strategy: 'jwt' }` を追加。`auth.ts` の callbacks を `jwt` + `session` 形式に変更 |

### ✅ 解決：JWTSessionError（2026-06-12）

`JWTSessionError: JWEInvalid: Invalid Compact JWE` が継続していた原因と対処：

**根本原因:** NextAuth v5 beta.31 では `providers` を含む `authConfig` を Edge で初期化すると、OAuth provider の client credentials 参照が JWT エンコーディングに影響し、`auth.ts`（PrismaAdapter + jwt callbacks）と `middleware.ts`（authConfig のみ）の2インスタンス間でトークンが復号できない状態になる。

**対処（2026-06-12）:**
- `lib/auth.config.ts` を3分割:
  - `authorizedCallback` — 認可ロジック（共通）
  - `authMiddlewareConfig` — ミドルウェア専用（`providers: []`、`secret` 明示）
  - `authConfig` — サインイン用フル設定（Google/GitHub providers を含む）
- `middleware.ts` を `authMiddlewareConfig` 使用に変更
- `auth.ts` の冗長な `session: { strategy: 'jwt' }` 重複宣言を除去（`authConfig` から継承）

**ポイント:** `secret: process.env.AUTH_SECRET` を明示することで、別インスタンス間の JWE 復号キーが一致する。`providers: []` でミドルウェアの Edge 初期化を軽量化。

**初回ログイン時の注意:** 古いセッション Cookie が残っている場合は削除してから再ログインすること（シークレットウィンドウ推奨）。

---

## 15. 次回セッション：ローカル実機テスト計画（2026-06-15 更新）

### 実装フェーズ完了状況（2026-06-15 時点）

> **Priority 1〜9 + レート制限・e2e拡充・Vercel Analytics・ビルド修正 すべて完了。**  
> 次のフェーズはローカル実機テストおよび本番デプロイ（Vercel + Railway）。

### 実施予定の確認項目

| 優先度 | 確認内容 | 手順 |
|---|---|---|
| 🔴 高 | DB マイグレーション確認 | `npx prisma migrate dev --name init`（初回）または `--name add-user-password`（既存DBの場合） |
| 🔴 高 | Google / GitHub OAuth ログイン | ブラウザでログインフロー全体を確認。エラー時は §14 の解決策を参照 |
| 🔴 高 | メール+パスワード 新規登録・ログイン | `/register` → 登録 → `/login` → Credentials でログイン |
| 🟡 中 | STEP 1〜4 ウィザード | `/projects/new` でジャンル選択〜キャラクター〜世界観〜障害まで通し確認 |
| 🟡 中 | STEP 5〜7 構成エディタ | プロット生成・3パターン比較・章構成作成 |
| 🟡 中 | STEP 8〜9 執筆エディタ | WritingAgent ストリーミング・インライン編集・ContinuationAgent サジェスト |
| 🟡 中 | 著作権ダッシュボード | 証明レコード作成・盗用スキャン・エクスポート（TXT/DOCX） |
| 🟢 低 | Playwright e2e | `npm run test:e2e`（`next dev` 起動後）— `E2E_AUTH_COOKIE` 設定で認証済みテストも実行 |

### 確認時の注意事項

- **ANTHROPIC_API_KEY** が必須（エージェント機能全般）
- **DOCX エクスポート**は `npm install` 後にのみ有効（`docx` パッケージが必要）
- **Vercel Analytics** はローカルでは計測されない（Vercel デプロイ後に確認）
- ローカルでの Stripe 課金テストは Stripe CLI の `stripe listen` が必要

### 想定される問題と対処

| 症状 | 原因候補 | 対処 |
|---|---|---|
| `prisma generate` エラー | sandbox生成のバイナリがWindows非対応 | Windows側で `npx prisma generate` を実行 |
| OAuth `invalid_client` | 環境変数名の誤り | `AUTH_GOOGLE_ID` / `AUTH_GITHUB_ID` を確認（`GOOGLE_CLIENT_ID` は旧形式） |
| `JWEInvalid` | 古いセッションCookieが残存 | シークレットウィンドウで再ログイン |
| WritingAgent がストリーミングしない | `ANTHROPIC_API_KEY` 未設定 | `.env.local` に `ANTHROPIC_API_KEY=sk-ant-...` を追加 |
| DOCX ダウンロードが空 | `docx` パッケージ未インストール | `npm install` を実行 |

### 本番デプロイ手順（将来参照用）

1. **Railway**: PostgreSQL インスタンス作成 → `DATABASE_URL` 取得
2. **Vercel**: GitHub リポジトリ連携 → 環境変数（§10 参照）を設定 → デプロイ
3. **Stripe**: 本番 API キー + Webhook エンドポイント（`/api/webhooks/stripe`）設定
4. **Supabase**（任意）: Storage バケット作成 → `NEXT_PUBLIC_SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 設定
5. `npx prisma migrate deploy`（本番DBマイグレーション）

---

## 16. 本番デプロイ完了（2026-06-21）

### デプロイ先

| サービス | URL / 情報 |
|---|---|
| **Vercel（フロント）** | `https://novel-master-chi.vercel.app` |
| **GitHub リポジトリ** | `https://github.com/mic-ai/novel_master` |
| **Railway（DB）** | PostgreSQL — `reseau.proxy.rlwy.net:22872` |

### 本番環境変数（Vercel に設定済み）

`ANTHROPIC_API_KEY` / `DATABASE_URL` / `AUTH_SECRET` / `AUTH_URL` / `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` / `COPYRIGHT_SIGNING_KEY` / `CONTENT_ENCRYPTION_KEY`

**重要:** next-auth v5 では `NEXTAUTH_URL` ではなく `AUTH_URL` を使う。

### トラブルシューティング記録

| 症状 | 原因 | 対処 |
|---|---|---|
| `MIDDLEWARE_INVOCATION_FAILED` | `auth.config.ts` の Google/GitHub provider インポートが Edge Runtime で失敗 | `middleware.ts` を next-auth 依存なしの Cookie 存在チェックに変更（`middleware.ts` 参照） |
| `TypeError: Invalid URL` | `NEXTAUTH_URL` が未設定（next-auth v5 は `AUTH_URL` を要求） | Vercel に `AUTH_URL=https://novel-master-chi.vercel.app` を追加 |
| `redirect_uri_mismatch` | Google Cloud Console で別のクライアント ID（`msf3e3...`）にリダイレクト URI を登録していた | 正しいクライアント `novel-agent-local`（`303p...`）に `https://novel-master-chi.vercel.app/api/auth/callback/google` を追加 |

### ミドルウェア変更の補足

`middleware.ts` は next-auth を使わないシンプルな実装に変更済み：
- `__Secure-authjs.session-token`（HTTPS）または `authjs.session-token`（HTTP）Cookie の存在で認証状態を判定
- JWT 署名検証は省略（セッション改ざんは Node.js ランタイムの next-auth ハンドラーが担保）
- 関連ファイル: `lib/auth.middleware-config.ts`（Edge 向け設定、現在 middleware.ts からは未使用）

### Google OAuth クライアント情報

- **クライアント名:** `novel-agent-local`
- **クライアント ID:** `712331988505-303pg6rrkilrd34ud2kes37iegaod9in.apps.googleusercontent.com`
- **承認済みリダイレクト URI:** `http://localhost:3000/api/auth/callback/google`（ローカル）/ `https://novel-master-chi.vercel.app/api/auth/callback/google`（本番）

---

## 17. 本番テスト中の修正（2026-06-22）

### 招待制登録の実装

開発期間中は URL を知る人物が誰でも登録できる状態だったため、招待制に変更。

| ファイル | 変更内容 |
|---|---|
| `app/api/auth/register/route.ts` | `process.env.INVITE_CODE` が設定されている場合、リクエストボディの `inviteCode` と照合。不一致は 403 |
| `app/(auth)/register/page.tsx` | `inviteCode` state と入力フィールドを追加（フォーム先頭）。サブタイトルを「招待コードが必要です」に変更 |

**運用:** Vercel 環境変数に `INVITE_CODE=<任意の文字列>` を追加するだけで有効化。未設定時は従来通り誰でも登録可。

---

### STEP4→STEP5 データフロー修正

コンフリクト設計（STEP4）からプロット生成（STEP5）に進む際に「プロジェクトの再読み込みに失敗します」エラーが発生していた問題を修正。

**根本原因（3層構造）:**

1. `app/api/agent/conflict/route.ts` — `void projectId` でDBへの保存が捨てられていた  
2. `app/(dashboard)/projects/new/page.tsx` — `void data` でコンフリクト結果が捨てられていた  
3. `app/api/agent/plot/route.ts` — `goal: '主人公の目標'` がハードコーディングされていた

**修正内容:**

| ファイル | 修正 |
|---|---|
| `prisma/schema.prisma` | `Project` モデルに `goal String?` / `plotObstacles Json?` フィールドを追加 |
| `prisma/migrations/20260622120959_add_goal_obstacles/` | Railway 本番 DB に適用済み |
| `app/api/agent/conflict/route.ts` | AI 分析後に `prisma.project.updateMany` で goal/obstacles を DB 保存。`maxDuration = 60` 追加 |
| `app/(dashboard)/projects/new/page.tsx` | `handleStep4Complete` を `async` に変更し `/api/projects/[id]` PATCH で goal/obstacles を保存してからリダイレクト |
| `app/api/agent/plot/route.ts` | DB から `project.goal` / `project.plotObstacles` を読み込む形に変更 |

**Railway マイグレーション注意:**
- `postgres.railway.internal` は Railway ネットワーク内部からしか到達不可
- ローカルからのマイグレーションは `reseau.proxy.rlwy.net:22872`（パブリックプロキシ URL）を使う
- `$env:DATABASE_URL="postgresql://postgres:...@reseau.proxy.rlwy.net:22872/railway"` を明示指定

---

### React error #438 の修正（Next.js 14 vs 15 の差異）

`app/(dashboard)/editor/[id]/structure/page.tsx` と `write/[ch]/page.tsx` で `use(params)` を使用していたためエラーが発生。

**原因:** `use()` は Next.js 15+ の API。Next.js 14 では `params` は同期的なプレーンオブジェクト。

| ファイル | 修正 |
|---|---|
| `editor/[id]/structure/page.tsx` | `params: Promise<{ id: string }>` → `params: { id: string }` に変更。`use` を import から削除。`const { id } = params;` に変更 |
| `editor/[id]/write/[ch]/page.tsx` | 同様に `params.id` / `params.ch` を直接参照 |

---

### Vercel タイムアウト対策（全エージェントルート）

Vercel serverless 関数のデフォルトタイムアウト（10秒）を超えて `ERR_CONNECTION_CLOSED` が発生。

**対処:** 全 12 エージェントルートに `export const maxDuration = 60;` を追加。

対象ファイル: `character` / `conflict` / `consistency` / `continue` / `genre` / `inline-edit` / `plot` / `plot/variants` / `refine` / `review` / `structure` / `summarize` / `world`

---

### プロット生成モデル・スキーマ最適化

Sonnet モデルが 60 秒制限内に JSON を返せないタイムアウト問題を解決。

| 変更 | 内容 |
|---|---|
| モデル変更 | `app/api/agent/plot/route.ts` / `plot/variants/route.ts` / `structure/route.ts` を `claude-haiku-4-5-20251001` に変更（速度優先） |
| `max_tokens` | 8192 → 4096（8192 はタイムアウト再発）|
| JSON スキーマ簡略化 | `lib/prompts/templates/plot-generator.ts` — 章ごとの `key_events[]` / `foreshadowing[]` を削除。`foreshadowing_list[]` を削除。要約を 100 字に短縮。最大 15 章の上限を明示 |
| ロバスト JSON 抽出 | `indexOf('{')` / `lastIndexOf('}')` で JSON ブロックを切り出し（コードブロック・前後文散文に対応） |
| エラーレスポンス改善 | 内部 catch が 200 + `{ raw }` を返していた → 422 + 日本語エラーメッセージに変更 |
| エラー表示 UI | `structure/page.tsx` に `plotError` state を追加し、422 時にエラーをユーザーに表示 |

---

### 環境変数追加（Vercel）

| 変数名 | 用途 |
|---|---|
| `INVITE_CODE` | 招待制登録の照合コード（未設定時は公開登録） |

---

---

## 18. 機能改善・バグ修正（2026-06-24）

### ① PlotGeneratorAgent SSEストリーミング化

Vercel の 60 秒タイムアウトを根本解決するため、プロット生成をブロッキング → SSE ストリーミングに変更。

| ファイル | 変更内容 |
|---|---|
| `app/api/agent/plot/route.ts` | `maxDuration = 300` / `dynamic = 'force-dynamic'` 追加。`client.messages.create({ stream: true })` でストリーミング。チャンクを `data: {"type":"delta","text":"..."}` 形式で逐次送信。全文受信後にJSONパース・DB保存・`{"type":"done"}` 送信 |
| `editor/[id]/structure/page.tsx` | `handleGeneratePlot` を SSE リーダーに変更。`done` 受信後に `/api/projects/${id}` を再フェッチしてプロットを表示。エラー時は `plotError` に表示 |

**SSE フォーマット:**
- `data: {"type":"delta","text":"..."}` — テキストチャンク
- `data: {"type":"done"}` — 完了（DB保存済み）
- `data: {"type":"error","message":"..."}` — エラー

---

### ② プロット修正（STEP 6）の章選択 UI

修正対象章をピルボタンで個別選択できるように改善。

| ファイル | 変更内容 |
|---|---|
| `lib/prompts/templates/plot-refiner.ts` | `targetChapters?: number[]` パラメータ追加。指定時はプロンプトに「対象外の章は絶対に変更しないこと」という強制制約セクションを挿入 |
| `app/api/agent/refine/route.ts` | リクエストボディから `targetChapters` を受け取りプロンプトへ渡す |
| `editor/[id]/structure/page.tsx` | 修正パネルに章選択 UI を追加（全章一括ボタン＋章別ピルボタン）。選択中の章タイトル一覧を小テキスト表示。`closeRefinePanel` で状態を一括リセット |

---

### ③ 章構成生成（StructureAgent）の修正

「AIの応答を解析できませんでした」エラーの根本原因はトークン不足による JSON 途中切断。

| ファイル | 変更内容 |
|---|---|
| `app/api/agent/structure/route.ts` | `max_tokens` 4096 → 8192。プロンプト出力フィールドを4つ（chapterNumber / title / sceneType / scenes）に削減。`tempoRole` / `targetWords` / `chapterEndingRule` / `foreshadowingIds` はコードで算出。入力JSON を compact 化（pretty-print → `JSON.stringify`）。JSON 抽出を `indexOf('[')` / `lastIndexOf(']')` 方式に変更。エラー時 422 + 日本語メッセージ返却 |
| `editor/[id]/structure/page.tsx` | `structureError` state 追加、API エラー時にメッセージを画面表示 |

---

### ④ 執筆エディタ（右パネル）の機能追加

| 機能 | 実装内容 |
|---|---|
| **プロット内容表示** | 右パネル「章の情報」に `plotOutline.chapters[n].summary` を表示（読み取り専用） |
| **視点キャラクター選択** | キャラクター一覧からドロップダウン選択 → `ChapterOutline.povCharacterId` に保存 → WritingAgent が名前解決して使用 |
| **この章の進行メモ** | テキストエリアで大まかな流れを記入。1.5 秒デバウンスで `ChapterOutline.scenes[0].summary` に保存 → WritingAgent の `sceneSummary` として参照。「プロットから自動入力」ボタンでプロット概要を転記 |

**関連ファイル:**

| ファイル | 変更内容 |
|---|---|
| `app/api/chapter-outlines/[id]/route.ts` | **新規作成。** `povCharacterId` / `scenes` を PATCH するエンドポイント。所有確認は `project.userId` 経由 |
| `app/api/agent/write/route.ts` | `outline.povCharacterId`（ID）を `project.characters` から名前に解決してプロンプトへ渡す |
| `editor/[id]/write/[ch]/page.tsx` | `ProjectData` に `plotOutline` / `characters` 追加。`povCharId` / `sceneMemo` / `isSavingOutline` state 追加。`saveOutline` / `handlePovChange` / `handleSceneMemoChange` / `handleAutoMemo` ハンドラ追加 |
| `components/editor/AiAssistantPanel.tsx` | 視点キャラ・進行メモ・プロット内容の3セクション追加。props 7つ追加 |

---

### ⑤ キャラクター口調フィールド追加

| ファイル | 変更内容 |
|---|---|
| `prisma/schema.prisma` | `Character` モデルに `speechStyle String? @db.Text` 追加 |
| `prisma/migrations/20260624000001_add_character_speech_style/migration.sql` | `ALTER TABLE "Character" ADD COLUMN "speechStyle" TEXT;` — Railway 本番 DB に適用済み |
| `components/editor/CharacterCard.tsx` | カード末尾にインジゴ色の専用セクション「口調・方言・口癖」追加。複数行テキストエリア。「AI執筆時に反映されます」注記付き |
| `lib/prompts/genre-rules.ts` | `Character` インターフェースに `speechStyle?: string | null` 追加 |
| `lib/prompts/templates/writing-agent.ts` | キャラクターコンテキスト行に `/ 口調：〜` を追加（設定時のみ）。AI執筆時に各キャラの口調で書かれる |
| `app/api/characters/[charId]/route.ts` / `CharactersClient.tsx` / `characters/page.tsx` | 全レイヤーで `speechStyle` を伝搬 |

**Railway マイグレーション実行コマンド（ローカル PowerShell から）:**
```powershell
$env:DATABASE_URL="postgresql://postgres:<PW>@reseau.proxy.rlwy.net:22872/railway"
npx prisma migrate deploy
```

---

*このCLAUDE.mdはプロジェクトの唯一の設定ソースです。仕様変更時は必ずこのファイルを先に更新してください。*
