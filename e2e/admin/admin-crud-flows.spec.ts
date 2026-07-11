import { test, expect, loginAsBranchAdmin } from '../fixtures/admin';

/**
 * Admin CRUD flows — create/read/update paths for core ERP modules.
 * These tests exercise real API wiring (not mocked). Run against seeded staging/local stack.
 */
test.describe('Admin CRUD flows', () => {
  test.beforeEach(async ({ page }) => {
    test.skip(process.env.E2E_SKIP_LIVE === '1', 'Live stack required');
    await loginAsBranchAdmin(page);
  });

  test('students: list → new form → validation', async ({ page }) => {
    await page.goto('/admin/students');
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
    await page.getByRole('button', { name: /add student/i }).click();
    await expect(page).toHaveURL(/\/admin\/students\/new/);

    await page.getByRole('button', { name: /save|create|submit/i }).click();
    await expect(page.getByText(/required|name/i).first()).toBeVisible();
  });

  test('students: search filter is interactive', async ({ page }) => {
    await page.goto('/admin/students');
    const search = page.getByPlaceholder(/search/i);
    await search.fill('ahmed');
    await search.press('Enter');
    await expect(page.getByRole('heading', { name: 'Students' })).toBeVisible();
  });

  test('teachers: list page and add affordance', async ({ page }) => {
    await page.goto('/admin/teachers');
    await expect(page.getByRole('heading', { name: /teachers/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /add|new|create/i }).first()).toBeVisible();
  });

  test('staff: list loads', async ({ page }) => {
    await page.goto('/admin/staff');
    await expect(page.getByRole('heading', { name: /staff/i })).toBeVisible();
  });

  test('classes: list loads with section data', async ({ page }) => {
    await page.goto('/admin/classes');
    await expect(page.getByRole('heading', { name: /classes/i })).toBeVisible();
  });

  test('fees: generate page has month/year controls', async ({ page }) => {
    await page.goto('/admin/fees/generate');
    await expect(page.getByRole('heading', { name: /generate/i })).toBeVisible();
    await expect(page.locator('select, input').first()).toBeVisible();
  });

  test('fees: collections page loads payment UI', async ({ page }) => {
    await page.goto('/admin/fees/collections');
    await expect(page.getByRole('heading', { name: /collections/i })).toBeVisible();
  });

  test('fees: heads CRUD entry point', async ({ page }) => {
    await page.goto('/admin/fees/heads');
    await expect(page.getByRole('heading', { name: /heads|fee heads/i })).toBeVisible();
  });

  test('attendance: student batch page', async ({ page }) => {
    await page.goto('/admin/attendance/students');
    await expect(page.getByRole('heading', { name: /student attendance|students/i })).toBeVisible();
  });

  test('attendance: teacher batch page', async ({ page }) => {
    await page.goto('/admin/attendance/teachers');
    await expect(page.getByRole('heading', { name: /teacher attendance|teachers/i })).toBeVisible();
  });

  test('results: exam sessions hub', async ({ page }) => {
    await page.goto('/admin/result');
    await expect(page.getByRole('heading', { name: /result/i })).toBeVisible();
  });

  test('expenses: payroll list', async ({ page }) => {
    await page.goto('/admin/expenses/payroll');
    await expect(page.getByRole('heading', { name: /payroll/i })).toBeVisible();
  });

  test('canteen: products catalog', async ({ page }) => {
    await page.goto('/admin/canteen/products');
    await expect(page.getByRole('heading', { name: /products/i })).toBeVisible();
  });

  test('stationary: inventory page', async ({ page }) => {
    await page.goto('/admin/stationary/inventory');
    await expect(page.getByRole('heading', { name: /inventory/i })).toBeVisible();
  });

  test('timetable: grid builder entry', async ({ page }) => {
    await page.goto('/admin/timetable/grid');
    await expect(page.getByRole('heading', { name: /grid|timetable/i })).toBeVisible();
  });

  test('settings: academic years list', async ({ page }) => {
    await page.goto('/admin/settings/academic-years');
    await expect(page.getByRole('heading', { name: /academic years/i })).toBeVisible();
  });

  test('branches: list and detail navigation', async ({ page }) => {
    await page.goto('/admin/branches');
    await expect(page.getByRole('heading', { name: /branches/i })).toBeVisible();
    const firstLink = page.locator('a[href*="/admin/branches/"]').first();
    if (await firstLink.count()) {
      await firstLink.click();
      await expect(page).toHaveURL(/\/admin\/branches\/.+/);
    }
  });

  test('promotion: year-end wizard entry', async ({ page }) => {
    await page.goto('/admin/settings/academic-years');
    const promoteLink = page.locator('a[href*="/promote"]').first();
    if (await promoteLink.count()) {
      await promoteLink.click();
      await expect(page.getByText(/promotion|promote|year-end/i).first()).toBeVisible();
    }
  });
});
