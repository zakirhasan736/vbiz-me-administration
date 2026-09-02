import { expect, test, type APIRequestContext } from '@playwright/test'

const MOCK_API = 'http://127.0.0.1:5101'

async function resetPublicVHits(request: APIRequestContext) {
  const res = await request.delete(`${MOCK_API}/__e2e/public-v-hits`)
  expect(res.ok()).toBeTruthy()
}

async function publicVHits(request: APIRequestContext): Promise<Record<string, number>> {
  const res = await request.get(`${MOCK_API}/__e2e/public-v-hits`)
  expect(res.ok()).toBeTruthy()
  const body = (await res.json()) as { hits?: Record<string, number> }
  return body.hits || {}
}

const troubleCopy = /having trouble loading this card right now/i
const next404Copy = /this page could not be found/i

test.describe('Public card fetch semantics', () => {
  test('valid profile / API 200 renders', async ({ page }) => {
    await page.goto('/vCard/e2e-public-card')
    await expect(page.getByRole('heading', { name: 'Public Test Card' })).toBeVisible()
    await expect(page).not.toHaveURL(/404/)
    await expect(page.getByText(troubleCopy)).toHaveCount(0)
  })

  test('nonexistent profile / API 404 is Next 404', async ({ page }) => {
    await page.goto('/vCard/e2e-missing-card')
    await expect(page.getByRole('heading', { name: '404' })).toBeVisible()
    await expect(page.getByRole('heading', { name: next404Copy })).toBeVisible()
    await expect(page.getByText(troubleCopy)).toHaveCount(0)
  })

  test('API 500 is error handling, not 404', async ({ page }) => {
    const response = await page.goto('/vCard/e2e-fail-500')
    expect(response?.status()).not.toBe(404)
    await expect(page.getByText(troubleCopy)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible()
    await expect(page.getByText(next404Copy)).toHaveCount(0)
  })

  test('API 503 is not 404', async ({ page }) => {
    await page.goto('/vCard/e2e-fail-503')
    await expect(page.getByText(troubleCopy)).toBeVisible()
    await expect(page.getByText(next404Copy)).toHaveCount(0)
  })

  test('API 429 is not 404', async ({ page }) => {
    await page.goto('/vCard/e2e-fail-429')
    await expect(page.getByText(troubleCopy)).toBeVisible()
    await expect(page.getByText(next404Copy)).toHaveCount(0)
  })

  test('malformed JSON is not 404', async ({ page }) => {
    await page.goto('/vCard/e2e-malformed-json')
    await expect(page.getByText(troubleCopy)).toBeVisible()
    await expect(page.getByText(next404Copy)).toHaveCount(0)
  })

  test('success=false unexpected 200 is not 404', async ({ page }) => {
    await page.goto('/vCard/e2e-success-false')
    await expect(page.getByText(troubleCopy)).toBeVisible()
    await expect(page.getByText(next404Copy)).toHaveCount(0)
  })

  test('generateMetadata + page share one bootstrap GET (HTML-only)', async ({ request }) => {
    await resetPublicVHits(request)
    const pageRes = await request.get('/vCard/e2e-public-card')
    expect(pageRes.ok()).toBeTruthy()
    const hits = await publicVHits(request)
    expect(hits['e2e-public-card'], JSON.stringify(hits)).toBe(1)
  })

  test('measure profile API calls from one full browser page load', async ({ page, request }) => {
    await resetPublicVHits(request)
    await page.goto('/vCard/e2e-public-card')
    await expect(page.getByRole('heading', { name: 'Public Test Card' })).toBeVisible()
    await page.waitForTimeout(1500)
    const hits = await publicVHits(request)
    const count = hits['e2e-public-card'] || 0
    console.log(`PROFILE_API_CALLS=${count} hits=${JSON.stringify(hits)}`)
    test.info().annotations.push({ type: 'profile-api-calls', description: String(count) })
    expect(
      count,
      `GET /api/v1/public/v/:slug/bootstrap count=${count} hits=${JSON.stringify(hits)}`
    ).toBeGreaterThanOrEqual(1)
    // HTML document is 1 (memoized). Extra calls are separate PWA icon/manifest route handlers, not metadata+page.
    expect(count).toBeLessThanOrEqual(6)
  })
})
