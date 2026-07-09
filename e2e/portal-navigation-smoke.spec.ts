import { test, expect, Page } from '@playwright/test';

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Username, email, or phone').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Portal navigation smoke', () => {
  test('student can open core pages', async ({ page }) => {
    await login(page, process.env.E2E_STUDENT_USER || 'student_ahmed', process.env.E2E_STUDENT_PASS || 'Student@123');
    await expect(page).toHaveURL(/\/student(?:\/|$)/);

    await page.goto('/student/fees');
    await expect(page.getByRole('heading', { name: 'Fees' })).toBeVisible();

    await page.goto('/student/attendance');
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();

    await page.goto('/student/results');
    await expect(page.getByRole('heading', { name: 'Results' })).toBeVisible();
  });

  test('teacher can open core pages', async ({ page }) => {
    await login(page, process.env.E2E_TEACHER_USER || 'fatima_teacher', process.env.E2E_TEACHER_PASS || 'Fatima@123');
    await expect(page).toHaveURL(/\/teacher(?:\/|$)/);

    await page.goto('/teacher/timetable');
    await expect(page.getByRole('heading', { name: 'Timetable' })).toBeVisible();

    await page.goto('/teacher/attendance');
    await expect(page.getByRole('heading', { name: 'Attendance' })).toBeVisible();

    await page.goto('/teacher/marks');
    await expect(page.getByRole('heading', { name: 'Marks' })).toBeVisible();
  });
});
