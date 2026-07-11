import { test as base, expect, Page } from '@playwright/test';

export type AdminCreds = { username: string; password: string };

type AdminFixtures = {
  adminPage: Page;
};

export const adminCreds: AdminCreds = {
  username: process.env.E2E_ADMIN_USER || 'admin',
  password: process.env.E2E_ADMIN_PASS || 'admin123',
};

export const ceoCreds: AdminCreds = {
  username: process.env.E2E_SUPERADMIN_USER || 'ceo@mothercareschool.com',
  password: process.env.E2E_SUPERADMIN_PASS || 'Ceo@098765',
};

export async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByLabel('Username, email, or phone').fill(username);
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Sign In' }).click();
}

/** Wait for admin shell after management login and ensure branch + AY scope exist. */
export async function loginAsBranchAdmin(page: Page) {
  await login(page, adminCreds.username, adminCreds.password);
  await page.waitForURL(/\/admin(?:\/|$)/, { timeout: 20_000 });

  await page.evaluate(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const branchId = localStorage.getItem('activeBranchId');
    if (!branchId) return;
    if (localStorage.getItem('activeAYId')) return;

    try {
      const res = await fetch(`/api/me/academic-year?branchId=${encodeURIComponent(branchId)}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json?.data?.id) {
        localStorage.setItem('activeAYId', json.data.id);
        localStorage.setItem('activeAYStatus', json.data.status);
      }
    } catch {
      /* optional — pages may still render */
    }
  });
}

export async function expectAdminHeading(page: Page, heading: string | RegExp) {
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 15_000 });
}

/** Admin list pages — smoke that each route renders without crashing. */
export const ADMIN_LIST_ROUTES: { path: string; heading: string | RegExp }[] = [
  { path: '/admin', heading: /dashboard|admin/i },
  { path: '/admin/students', heading: 'Students' },
  { path: '/admin/students/new', heading: /new student|add student/i },
  { path: '/admin/students/operations', heading: /operations/i },
  { path: '/admin/teachers', heading: /teachers/i },
  { path: '/admin/staff', heading: /staff/i },
  { path: '/admin/classes', heading: /classes/i },
  { path: '/admin/branches', heading: /branches/i },
  { path: '/admin/fees', heading: /fees/i },
  { path: '/admin/fees/heads', heading: /fee heads|heads/i },
  { path: '/admin/fees/generate', heading: /generate/i },
  { path: '/admin/fees/collections', heading: /collections/i },
  { path: '/admin/fees/families', heading: /families/i },
  { path: '/admin/fees/reports', heading: /reports/i },
  { path: '/admin/fees/analytics', heading: /analytics/i },
  { path: '/admin/attendance', heading: /attendance/i },
  { path: '/admin/attendance/students', heading: /student attendance|students/i },
  { path: '/admin/attendance/teachers', heading: /teacher attendance|teachers/i },
  { path: '/admin/attendance/staff', heading: /staff attendance|staff/i },
  { path: '/admin/attendance/reports', heading: /reports/i },
  { path: '/admin/result', heading: /result/i },
  { path: '/admin/result/compute', heading: /compute/i },
  { path: '/admin/result/report-cards', heading: /report cards/i },
  { path: '/admin/result/reports', heading: /reports/i },
  { path: '/admin/result/analytics', heading: /analytics/i },
  { path: '/admin/expenses', heading: /expenses/i },
  { path: '/admin/expenses/payroll', heading: /payroll/i },
  { path: '/admin/expenses/others', heading: /others/i },
  { path: '/admin/expenses/utilities', heading: /utilities/i },
  { path: '/admin/expenses/reports', heading: /reports/i },
  { path: '/admin/canteen', heading: /canteen/i },
  { path: '/admin/canteen/products', heading: /products/i },
  { path: '/admin/canteen/inventory', heading: /inventory/i },
  { path: '/admin/canteen/sales', heading: /sales/i },
  { path: '/admin/canteen/accounts', heading: /accounts/i },
  { path: '/admin/canteen/summary', heading: /summary/i },
  { path: '/admin/stationary', heading: /stationary/i },
  { path: '/admin/stationary/products', heading: /products/i },
  { path: '/admin/stationary/inventory', heading: /inventory/i },
  { path: '/admin/stationary/sales-records', heading: /sales/i },
  { path: '/admin/timetable', heading: /timetable/i },
  { path: '/admin/timetable/grid', heading: /grid|timetable/i },
  { path: '/admin/settings', heading: /settings/i },
  { path: '/admin/settings/academic-years', heading: /academic years/i },
  { path: '/admin/settings/subjects', heading: /subjects/i },
  { path: '/admin/settings/archived-years', heading: /archived/i },
  { path: '/admin/profile', heading: /profile|admin/i },
];

export const test = base.extend<AdminFixtures>({
  adminPage: async ({ page }, use) => {
    await loginAsBranchAdmin(page);
    await use(page);
  },
});

export { expect };
