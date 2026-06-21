import { test, expect } from '@playwright/test';

// ────────────────────────────────────────────────────────────────────────────
// API ヘルスチェック（認証不要のエンドポイント）
// これらは実際のAPIレスポンス形式を検証する軽量なスモークテスト。
// ────────────────────────────────────────────────────────────────────────────
test.describe('API スモークテスト', () => {
  test('GET /api/projects は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.get('/api/projects');
    expect(res.status()).toBe(401);
  });

  test('POST /api/agent/genre は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/agent/genre', {
      data: { preferences: 'テスト' },
    });
    expect(res.status()).toBe(401);
  });

  test('POST /api/copyright/scan は認証なしで 401 を返す', async ({ request }) => {
    const res = await request.post('/api/copyright/scan', {
      data: { projectId: 'test' },
    });
    expect(res.status()).toBe(401);
  });

  test('GET /terms は 200 を返す', async ({ request }) => {
    const res = await request.get('/terms');
    expect(res.status()).toBe(200);
  });

  test('GET /login は 200 を返す', async ({ request }) => {
    const res = await request.get('/login');
    expect(res.status()).toBe(200);
  });
});
