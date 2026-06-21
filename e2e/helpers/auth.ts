import { Page } from '@playwright/test';

// Stub auth helper — in real e2e you'd sign in via OAuth or set session cookies.
// For now we mock the session by manipulating localStorage or cookies.
export async function mockSession(page: Page, userId = 'test-user-id') {
  await page.goto('/');
  await page.evaluate((id) => {
    // NextAuth stores session in a cookie; in test env we can set it via API
    localStorage.setItem('__e2e_user_id', id);
  }, userId);
}

export async function isLoggedIn(page: Page): Promise<boolean> {
  const url = page.url();
  return !url.includes('/login');
}
