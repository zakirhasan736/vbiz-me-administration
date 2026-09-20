import { expect, type APIRequestContext, type Page } from '@playwright/test'

export const MOCK_API = 'http://127.0.0.1:5101'
export const PUBLIC_CARD_PATH = '/vCard/e2e-public-card'
export const INTRO_CARD_PATH = '/vCard/e2e-intro-card'

export async function resetGuestLeads(request: APIRequestContext) {
  const res = await request.delete(`${MOCK_API}/__e2e/guest-leads`)
  expect(res.ok()).toBeTruthy()
}

export async function guestLeads(
  request: APIRequestContext
): Promise<Array<{ profile_id: string; full_name: string; phone: string; email: string; meta?: unknown }>> {
  const res = await request.get(`${MOCK_API}/__e2e/guest-leads`)
  expect(res.ok()).toBeTruthy()
  const body = (await res.json()) as {
    leads?: Array<{ profile_id: string; full_name: string; phone: string; email: string }>
  }
  return body.leads || []
}

export async function prepareVisitor(page: Page, options?: { declinePush?: boolean }) {
  const declinePush = options?.declinePush !== false
  await page.addInitScript((decline: boolean) => {
    try {
      if (decline) {
        localStorage.setItem('vbiz_push_declined_e2e-public-card', '1')
        localStorage.setItem('vbiz_push_declined_e2e-intro-card', '1')
      } else {
        localStorage.removeItem('vbiz_push_declined_e2e-public-card')
        localStorage.removeItem('vbiz_push_declined_e2e-intro-card')
      }
      void navigator.serviceWorker?.getRegistrations?.().then((regs) => {
        for (const reg of regs) void reg.unregister()
      })
    } catch {
      /* private mode */
    }
  }, declinePush)
}

export async function gotoPublicCard(page: Page, path = PUBLIC_CARD_PATH) {
  await page.goto(path)
  await page
    .locator('.vbiz-preloader')
    .waitFor({ state: 'hidden', timeout: 20_000 })
    .catch(() => undefined)
}

export async function skipIntroIfPresent(page: Page) {
  const skip = page.getByRole('button', { name: 'Skip intro' })
  await skip
    .waitFor({ state: 'visible', timeout: 12_000 })
    .then(() => skip.click({ force: true }))
    .catch(() => undefined)
}

export async function dismissFollowIfPresent(page: Page) {
  const notNow = page.getByRole('button', { name: /^Not Now$|^No Thanks$/i })
  await notNow
    .waitFor({ state: 'visible', timeout: 2_500 })
    .then(() => notNow.click({ force: true }))
    .catch(() => undefined)
}

export async function openReadyPublicCard(page: Page, path = PUBLIC_CARD_PATH) {
  await gotoPublicCard(page, path)
  await skipIntroIfPresent(page)
  await dismissFollowIfPresent(page)
  const heading = path.includes('intro') ? 'Intro Test Card' : 'Public Test Card'
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20_000 })
}

export async function openCardModal(page: Page, eventName: string) {
  const panel = page.locator('.vbiz-modal-panel').first()
  await page.evaluate((name) => window.dispatchEvent(new CustomEvent(name)), eventName)
  const opened = await panel
    .waitFor({ state: 'visible', timeout: 4_000 })
    .then(() => true)
    .catch(() => false)
  if (!opened) {
    await page.evaluate((name) => window.dispatchEvent(new CustomEvent(name)), eventName)
  }
}
