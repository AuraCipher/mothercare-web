import { test, expect, Page } from '@playwright/test';

type Creds = { username?: string; password?: string };

const creds = {
  superAdmin: {
    username: process.env.E2E_SUPERADMIN_USER,
    password: process.env.E2E_SUPERADMIN_PASS,
  } satisfies Creds,
  teacher: {
    username: process.env.E2E_TEACHER_USER || 'fatima_teacher',
    password: process.env.E2E_TEACHER_PASS || 'Fatima@123',
  } satisfies Creds,
  student: {
    username: process.env.E2E_STUDENT_USER || 'student_ahmed',
    password: process.env.E2E_STUDENT_PASS || 'Student@123',
  } satisfies Creds,
};

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Username, email, or phone').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

test.describe('Auth role landing', () => {
  test('student lands on /student', async ({ page }) => {
    await login(page, creds.student.username!, creds.student.password!);
    await expect(page).toHaveURL(/\/student(?:\/|$)/);
  });

  test('teacher lands on /teacher', async ({ page }) => {
    await login(page, creds.teacher.username!, creds.teacher.password!);
    await expect(page).toHaveURL(/\/teacher(?:\/|$)/);
  });

  test('super admin lands on /ceo (when credentials provided)', async ({ page }) => {
    test.skip(!creds.superAdmin.username || !creds.superAdmin.password, 'super admin creds not configured');
    await login(page, creds.superAdmin.username!, creds.superAdmin.password!);
    await expect(page).toHaveURL(/\/ceo(?:\/|$)/);
  });
});
