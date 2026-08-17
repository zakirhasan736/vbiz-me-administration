import { expect, test } from '@playwright/test'
import { signIn } from './helpers'

test.describe('Card Builder', () => {
  test('new card creation validates required fields and creates a draft', async ({ page }) => {
    await signIn(page)
    await page.goto('/vcards/create/home/5')

    const createDraft = page.getByRole('button', { name: 'Create draft' })
    await expect(createDraft).toBeVisible()
    await createDraft.click()
    await expect(page.getByText('Please enter your name before creating the vCard.')).toBeVisible()

    await page.getByRole('link', { name: /Personal Info/ }).click()
    const fields = page.locator('[data-tour="tab-form"] input')
    await fields.nth(0).fill('e2e-draft-card')
    await fields.nth(1).fill('E2E Draft Card')
    await fields.nth(2).fill('draft@example.com')
    await fields.nth(8).fill('+15550003333')

    await page.getByRole('link', { name: /Extra Fields/ }).click()
    const createResponse = page.waitForResponse(
      (response) => response.url().includes('/api/v1/profiles') && response.request().method() === 'POST'
    )
    await page.getByRole('button', { name: 'Create draft' }).click()
    const response = await createResponse
    expect(response.status()).toBe(201)
    expect((await response.json()).data).toMatchObject({ name: 'E2E Draft Card', isDraft: true, isPublic: false })
    await expect(page).toHaveURL(/\/vcards\/edit\/home\/\d+|\/vcards\/edit\/home\?cardId=/)
  })

  test('edit view autosaves the latest personal information', async ({ page }) => {
    await signIn(page)
    await page.goto('/vcards/edit/home/2?cardId=card-1')

    const fields = page.locator('[data-tour="tab-form"] input')
    await expect(fields.nth(1)).toHaveValue('Existing Card')
    await fields.nth(1).fill('Autosaved E2E Card')

    const updateResponse = await page.waitForResponse(
      (response) => response.url().includes('/api/v1/profiles/card-1') && response.request().method() === 'PATCH'
    )
    expect(updateResponse.status()).toBe(200)
    expect((await updateResponse.json()).data).toMatchObject({ name: 'Autosaved E2E Card' })
    await expect(page.getByRole('button', { name: /Saved/ })).toBeVisible()

    await page.reload()
    await page.goto('/vcards/edit/home/2?cardId=card-1')
    await expect(page.locator('[data-tour="tab-form"] input').nth(1)).toHaveValue('Autosaved E2E Card')
  })
})
