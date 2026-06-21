import { test, expect } from '@playwright/test';

// ────────────────────────────────────────────────────────────────────────────
// STEP 1-4: 新規プロジェクト作成ウィザード
// NOTE: これらのテストは認証済みセッションが必要なため、
//       CI では `E2E_BASE_URL` と事前セットアップされたDBが必要。
//       ローカルでは next dev + テストユーザーのセッション cookie を使う。
// ────────────────────────────────────────────────────────────────────────────
test.describe('新規プロジェクトウィザード (STEP 1-4)', () => {
  test.skip(
    !process.env.E2E_AUTH_COOKIE,
    'E2E_AUTH_COOKIE が設定されていないためスキップ（認証済みセッションが必要）',
  );

  test.beforeEach(async ({ page, context }) => {
    // 認証 cookie を設定
    const cookie = JSON.parse(process.env.E2E_AUTH_COOKIE ?? '[]');
    await context.addCookies(cookie);
  });

  test('STEP 1: ジャンル選択ページが表示される', async ({ page }) => {
    await page.goto('/projects/new');
    await expect(page.getByText('ジャンル')).toBeVisible({ timeout: 10_000 });
  });

  test('STEP 1: ジャンルを選択するとAIがキャラクター候補を生成する', async ({ page }) => {
    await page.goto('/projects/new');
    // ジャンルボタンをクリック（例: 恋愛・ロマンス）
    await page.getByRole('button', { name: /恋愛|ロマンス/i }).first().click();
    // AIが応答するまで待機（最大15秒）
    await expect(page.getByText(/キャラクター|主人公/i)).toBeVisible({ timeout: 15_000 });
  });
});
