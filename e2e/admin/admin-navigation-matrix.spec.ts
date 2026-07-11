import { test, expect, ADMIN_LIST_ROUTES, loginAsBranchAdmin } from '../fixtures/admin';

/**
 * Smoke matrix: every admin list/settings route loads without a hard crash.
 * Requires live web + API + seed (admin/admin123).
 */
test.describe('Admin navigation matrix', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      process.env.E2E_SKIP_LIVE === '1',
      'Set E2E_SKIP_LIVE=0 and run web+API with seed to execute live admin E2E',
    );
    await loginAsBranchAdmin(page);
  });

  for (const route of ADMIN_LIST_ROUTES) {
    test(`loads ${route.path}`, async ({ page }) => {
      const response = await page.goto(route.path);
      expect(response?.status(), `HTTP status for ${route.path}`).toBeLessThan(500);

      const bodyText = await page.locator('body').innerText();
      expect(bodyText.toLowerCase()).not.toContain('application error');
      expect(bodyText.toLowerCase()).not.toContain('unhandled runtime error');

      await expect(page.getByRole('heading', { name: route.heading }).first()).toBeVisible({
        timeout: 20_000,
      });
    });
  }
});
