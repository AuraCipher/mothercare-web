import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3000';
const isCI = !!process.env.CI;
const isLiveE2E = process.env.E2E_SKIP_LIVE !== '1';

export default defineConfig({
  testDir: './e2e',
  timeout: isLiveE2E ? 90_000 : 60_000,
  expect: {
    timeout: 15_000,
  },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  // CI live E2E: backend is started by the workflow; Playwright only boots Next.js.
  webServer: isCI
    ? {
        command: 'npm run start',
        url: baseURL,
        reuseExistingServer: false,
        timeout: 180_000,
      }
    : undefined,
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
