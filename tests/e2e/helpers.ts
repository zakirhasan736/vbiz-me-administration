import { expect, type Page } from '@playwright/test'

export async function signIn(page: Page) {
  await page.goto('/login')
  await page.getByLabel('Email Address').fill('admin@example.com')
  await page.getByRole('textbox', { name: 'Password' }).fill('ValidPassword1!')
  const loginResponse = page.waitForResponse((response) => response.url().includes('/auth/login'))
  await page.getByRole('button', { name: 'Log In' }).click()
  await loginResponse
  await expect(page).toHaveURL(/\/admin\/dashboard$/)
  await expect(page.getByRole('heading', { name: /Welcome back, E2E Admin/ })).toBeVisible()
  // Allow redux-persist to commit the authenticated state before tests perform a full navigation.
  await page.waitForTimeout(250)
}
