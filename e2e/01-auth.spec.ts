import { test, expect } from '@playwright/test';

// ────────────────────────────────────────────────────────────────────────────
// Auth flow — unauthenticated redirects
// ────────────────────────────────────────────────────────────────────────────
test.describe('認証リダイレクト', () => {
  test('未ログイン状態でのプロジェクト一覧へのアクセスはログインページへリダイレクト', async ({ page }) => {
    await page.goto('/projects');
    await expect(page).toHaveURL(/\/login/);
  });

  test('未ログイン状態でエディタへのアクセスはログインページへリダイレクト', async ({ page }) => {
    await page.goto('/editor/some-project-id/write/1');
    await expect(page).toHaveURL(/\/login/);
  });

  test('ログインページにはGoogleとGitHubのサインインボタンが存在する', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('GitHub')).toBeVisible();
  });

  test('利用規約ページは認証不要でアクセスできる', async ({ page }) => {
    await page.goto('/terms');
    await expect(page.getByText('著作権・免責事項')).toBeVisible();
  });
});
