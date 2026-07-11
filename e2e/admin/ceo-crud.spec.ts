import { test, expect, ceoCreds, login } from '../fixtures/admin';

test.describe('CEO admin CRUD', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.E2E_SKIP_LIVE === '1', 'Live stack required');
    test.skip(!ceoCreds.username || !ceoCreds.password, 'CEO credentials not configured');
    await login(page, ceoCreds.username, ceoCreds.password);
    await page.waitForURL(/\/ceo(?:\/|$)/, { timeout: 20_000 });
  });

  test('CEO dashboard loads', async ({ page }) => {
    await page.goto('/ceo');
    await expect(page.getByRole('heading').first()).toBeVisible();
  });

  test('CEO admins list loads', async ({ page }) => {
    await page.goto('/ceo/admins');
    await expect(page.getByText(/admin|invitation|principal/i).first()).toBeVisible();
  });

  test('CEO branches overview', async ({ page }) => {
    await page.goto('/ceo/branches');
    await expect(page.getByText(/branch/i).first()).toBeVisible();
  });
});
