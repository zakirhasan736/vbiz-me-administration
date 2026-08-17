import { defineConfig, devices } from '@playwright/test'

process.env.NEXT_PUBLIC_API_URL ||= 'http://127.0.0.1:5101/api/v1'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 45_000,
  expect: {
    timeout: 10_000,
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [['line'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: 'http://127.0.0.1:3101',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: [
    {
      command: 'corepack yarn e2e:mock-api',
      url: 'http://127.0.0.1:5101/api/v1/health',
      reuseExistingServer: false,
      timeout: 120_000,
    },
    {
      command: 'corepack yarn dev -p 3101',
      url: 'http://127.0.0.1:3101/login',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
