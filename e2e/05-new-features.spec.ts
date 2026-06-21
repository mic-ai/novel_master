import { test, expect } from '@playwright/test';

// ────────────────────────────────────────────────────────────────────────────
// P6〜P9 新機能の API スモークテスト（認証不要エンドポイント）
// ────────────────────────────────────────────────────────────────────────────
test.describe('新機能 API スモークテスト（401 確認）', () => {
  test('POST /api/agent/continue は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/continue', {
      data: { projectId: 'x', chapterNumber: 1, currentContent: 'テスト' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/agent/plot/variants は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/plot/variants', {
      data: { projectId: 'x' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/agent/consistency は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/consistency', {
      data: { projectId: 'x' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/agent/inline-edit は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/inline-edit', {
      data: { projectId: 'x', selectedText: 'テスト', instruction: 'rewrite' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/agent/summarize は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/summarize', {
      data: { projectId: 'x', chapterNumber: 1, content: 'テスト' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /api/foreshadowing は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.get('/api/foreshadowing?projectId=x');
    expect(res.status()).toBe(401);
  });

  test('GET /api/characters/xxx は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.patch('/api/characters/xxx', {
      data: { arcProgress: 50 },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/agent/refine は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/refine', {
      data: { projectId: 'x', editRequest: 'テスト' },
    });
    expect(res.status()).toBe(401);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 新規登録 API（認証不要・入力検証）
// ────────────────────────────────────────────────────────────────────────────
test.describe('新規登録 API', () => {
  test('POST /api/auth/register はボディなしで 400 を返す', async ({ request }) => {
    const res = await request.post('/api/auth/register', { data: {} });
    expect(res.status()).toBe(400);
  });

  test('POST /api/auth/register は短いパスワードで 400 を返す', async ({ request }) => {
    const res = await request.post('/api/auth/register', {
      data: { email: 'test@example.com', password: 'short' },
    });
    expect(res.status()).toBe(400);
    const body = await res.json() as { error: string };
    expect(body.error).toContain('8文字');
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 新規公開ページ（認証不要）
// ────────────────────────────────────────────────────────────────────────────
test.describe('新規公開ページ', () => {
  test('GET /register は 200 を返す', async ({ request }) => {
    const res = await request.get('/register');
    expect(res.status()).toBe(200);
  });

  test('GET /privacy は 200 を返す', async ({ request }) => {
    const res = await request.get('/privacy');
    expect(res.status()).toBe(200);
  });

  test('登録ページにフォームが表示される', async ({ page }) => {
    await page.goto('/register');
    await expect(page.getByText('アカウント登録')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.getByRole('button', { name: '登録する' })).toBeVisible();
  });

  test('ログインページにメール/パスワードフォームが追加されている', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByText('Google')).toBeVisible();
    await expect(page.getByText('GitHub')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 新規保護ページ（認証必要 → リダイレクト確認）
// ────────────────────────────────────────────────────────────────────────────
test.describe('新規保護ページ — 未認証リダイレクト', () => {
  test('キャラクター管理ページは未認証でログインへリダイレクト', async ({ page }) => {
    await page.goto('/editor/test-id/characters');
    await expect(page).toHaveURL(/\/login/);
  });

  test('伏線ボードは未認証でログインへリダイレクト', async ({ page }) => {
    await page.goto('/editor/test-id/foreshadowing');
    await expect(page).toHaveURL(/\/login/);
  });

  test('著作権ダッシュボードは未認証でログインへリダイレクト', async ({ page }) => {
    await page.goto('/editor/test-id/copyright');
    await expect(page).toHaveURL(/\/login/);
  });
});

// ────────────────────────────────────────────────────────────────────────────
// 認証済みテスト（E2E_AUTH_COOKIE 必要）
// ────────────────────────────────────────────────────────────────────────────
test.describe('認証済み — 新規ページ表示確認', () => {
  test.skip(
    !process.env.E2E_AUTH_COOKIE,
    'E2E_AUTH_COOKIE が設定されていないためスキップ',
  );

  const PROJECT_ID = process.env.E2E_PROJECT_ID ?? 'test-project-id';

  test.beforeEach(async ({ context }) => {
    const cookie = JSON.parse(process.env.E2E_AUTH_COOKIE ?? '[]');
    await context.addCookies(cookie);
  });

  test('キャラクター管理ページが表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/characters`);
    await expect(page.getByText('キャラクター管理')).toBeVisible({ timeout: 10_000 });
  });

  test('伏線ボードが3列カンバンで表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/foreshadowing`);
    await expect(page.getByText('伏線ボード')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText('未設置')).toBeVisible();
    await expect(page.getByText('設置済み')).toBeVisible();
    await expect(page.getByText('回収済み')).toBeVisible();
  });

  test('著作権ダッシュボードが表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/copyright`);
    await expect(page.getByText('著作権保護')).toBeVisible({ timeout: 10_000 });
  });

  test('構成エディタに「3パターン比較」ボタンが表示される', async ({ page }) => {
    await page.goto(`/editor/${PROJECT_ID}/structure`);
    await expect(page.getByText('3パターン比較')).toBeVisible({ timeout: 10_000 });
  });
});
