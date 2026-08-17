import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test.describe('Backoffice, Admin, and Public Card', () => {
  test('admin can move from dashboard to My Cards without a broken shell', async ({ page }) => {
    await signIn(page)
    await page.goto('/admin/dashboard')

    await expect(page.getByRole('heading', { name: /Welcome back, E2E Admin/ })).toBeVisible()
    await page.getByRole('link', { name: 'My Cards', exact: true }).first().click()
    await expect(page).toHaveURL(/\/admin\/mycards$/)
    await expect(page.getByText('Card list', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create card', exact: true })).toBeVisible()
  })

  test('public card renders its identity and keyboard-accessible navigation', async ({ page }) => {
    await page.goto('/v/e2e-public-card')

    await expect(page.getByRole('heading', { name: 'Public Test Card' })).toBeVisible()
    const navigation = page.getByRole('tablist', { name: 'Profile navigation' })
    await expect(navigation).toBeVisible()
    const aboutTab = page.getByRole('tab', { name: 'About Me' })
    await expect(aboutTab).toBeVisible()
    await aboutTab.focus()
    await page.keyboard.press('Enter')
    await expect(aboutTab).toHaveAttribute('aria-selected', 'true')
  })
})
