import { test, expect } from '@playwright/test';

// ────────────────────────────────────────────────────────────────────────────
// STEP 7-9: 執筆エディタ（認証済みセッションが必要）
// ────────────────────────────────────────────────────────────────────────────
test.describe('執筆エディタ (STEP 7-9)', () => {
  test.skip(
    !process.env.E2E_AUTH_COOKIE,
    'E2E_AUTH_COOKIE が設定されていないためスキップ',
  );

  const PROJECT_ID = process.env.E2E_PROJECT_ID ?? 'test-project-id';

  test.beforeEach(async ({ context }) => {
    const cookie = JSON.parse(process.env.E2E_AUTH_COOKIE ?? '[]');
    await context.addCookies(cookie);
  });

  test('執筆エディタの3ペインレイアウトが表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/write/1`);
    // 左ペイン: 章ナビ
    await expect(page.getByText('章一覧')).toBeVisible({ timeout: 10_000 });
    // 中央ペイン: テキストエリア（テキストエリアまたはcontenteditable）
    await expect(page.locator('textarea')).toBeVisible();
    // 右ペイン: AI アシスタント
    await expect(page.getByText(/AI生成|生成する/i)).toBeVisible();
  });

  test('テキストエリアに入力すると自動保存インジケータが表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/write/1`);
    await page.locator('textarea').fill('テスト文章です。自動保存が機能するか確認します。');
    await expect(page.getByText(/保存|saving/i)).toBeVisible({ timeout: 5_000 });
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 著作権エクスポートページ
// ────────────────────────────────────────────────────────────────────────────
test.describe('著作権・エクスポートページ', () => {
  test.skip(
    !process.env.E2E_AUTH_COOKIE,
    'E2E_AUTH_COOKIE が設定されていないためスキップ',
  );

  const PROJECT_ID = process.env.E2E_PROJECT_ID ?? 'test-project-id';

  test.beforeEach(async ({ context }) => {
    const cookie = JSON.parse(process.env.E2E_AUTH_COOKIE ?? '[]');
    await context.addCookies(cookie);
  });

  test('著作権ダッシュボードが表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/export`);
    await expect(page.getByText('著作権保護ダッシュボード')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('証明レコード')).toBeVisible();
    await expect(page.getByText('類似度チェック')).toBeVisible();
  });

  test('エクスポートボタンでモーダルが開く', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/export`);
    await page.getByRole('button', { name: 'エクスポート' }).click();
    await expect(page.getByText('をエクスポート')).toBeVisible();
    await expect(page.getByText('著作権フッターを追加する')).toBeVisible();
  });
});
