import { defineConfig } from '@playwright/test'

/** Schema audit against a running app. Does not boot the mock API. */
export default defineConfig({
  testDir: './tests/e2e',
  testMatch: 'public-card-schema.spec.ts',
  timeout: 20 * 60 * 1000,
  retries: 0,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: process.env.SCHEMA_BASE_URL || 'http://127.0.0.1:3012',
  },
})
