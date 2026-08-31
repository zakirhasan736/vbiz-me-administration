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

  test('expired admin sessions go to login instead of silently refreshing', async ({ page }) => {
    await signIn(page)
    await page.route('**/api/v1/admin/**', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, statusCode: 401, message: 'Access token expired' }),
      })
    })

    // The admin shell keeps its profile query mounted across route changes; reload to force a request.
    await page.reload()
    await expect(page).toHaveURL(/\/login$/)
    await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible()
  })

  test('public card renders its identity and keyboard-accessible navigation', async ({ page }) => {
    await page.goto('/v/e2e-public-card')

    await expect(page.getByRole('heading', { name: 'Public Test Card' })).toBeVisible()
    await expect(page).toHaveTitle('Public Test Card | Virtual Card')
    await expect(page.locator('meta[name="description"]')).toHaveAttribute(
      'content',
      'Explore the Public Test Card digital business profile.'
    )
    await expect(page.locator('meta[name="keywords"]')).toHaveAttribute('content', /vbizme.*virtual card/i)
    const navigation = page.getByRole('tablist', { name: 'Profile navigation' })
    await expect(navigation).toBeVisible()
    const aboutTab = page.getByRole('tab', { name: 'About Me' })
    await expect(aboutTab).toBeVisible()
    await aboutTab.focus()
    await page.keyboard.press('Enter')
    await expect(aboutTab).toHaveAttribute('aria-selected', 'true')
  })

  test('public notepad sends a note and shows the owner reply after reopening', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('vbiz_profile_visitor_public-card-1', 'e2e-note-visitor')
      localStorage.setItem('vbiz_push_declined_e2e-public-card', '1')
    })
    await page.goto('/v/e2e-public-card')

    const promptClose = page.locator('.vbiz-modal-backdrop .vbiz-modal-close')
    await promptClose
      .waitFor({ state: 'visible', timeout: 3_500 })
      .then(() => promptClose.click({ force: true }))
      .catch(() => undefined)
    await expect(page.locator('.vbiz-preloader')).toHaveCount(0, { timeout: 10_000 })
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('openNotepadAction')))
    await expect(page.getByRole('heading', { name: 'Notepad Guestbook' })).toBeVisible()
    await page.locator('.vbiz-modal-panel input[type="text"]').fill('E2E Visitor')
    await page.locator('.vbiz-modal-panel textarea').fill('Please send me the details.')
    await page.getByRole('button', { name: /Attach Note/ }).click()
    await expect(page.getByText('Note added successfully!', { exact: true })).toBeVisible()

    const replyResponse = await page.request.patch('http://127.0.0.1:5101/api/v1/admin/leads/notes/mock-note-1', {
      headers: {
        Authorization: 'Bearer eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJleHAiOjQxMDAwMDAwMDB9.e2e-signature',
        'Content-Type': 'application/json',
      },
      data: { lastReply: 'Thank you. I will send the details shortly.' },
    })
    expect(replyResponse.ok()).toBeTruthy()

    await page.locator('.vbiz-modal-panel button').first().click()
    await page.evaluate(() => window.dispatchEvent(new CustomEvent('openNotepadAction')))
    await expect(page.getByText('Reply from Public Test Card', { exact: true })).toBeVisible()
    await expect(page.getByText('Thank you. I will send the details shortly.', { exact: true })).toBeVisible()
  })
})
