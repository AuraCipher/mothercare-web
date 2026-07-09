import { test, expect, Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Username, email, or phone').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Proxy route guards', () => {
  test('redirects unauthenticated protected route to login with redirect param', async ({ page }) => {
    await page.goto('/teacher');
    await expect(page).toHaveURL(/\/login\?redirect=%2Fteacher$/);
  });

  test('teacher is redirected away from admin namespace', async ({ page }) => {
    await login(page, process.env.E2E_TEACHER_USER || 'fatima_teacher', process.env.E2E_TEACHER_PASS || 'Fatima@123');
    await expect(page).toHaveURL(/\/teacher(?:\/|$)/);
    await page.goto('/admin/students');
    await expect(page).toHaveURL(/\/teacher(?:\/|$)/);
  });

  test('student is redirected away from admin namespace', async ({ page }) => {
    await login(page, process.env.E2E_STUDENT_USER || 'student_ahmed', process.env.E2E_STUDENT_PASS || 'Student@123');
    await expect(page).toHaveURL(/\/student(?:\/|$)/);
    await page.goto('/admin/students');
    await expect(page).toHaveURL(/\/student(?:\/|$)/);
  });
});
