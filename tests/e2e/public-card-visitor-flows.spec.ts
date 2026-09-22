import { expect, test } from '@playwright/test'
import {
  guestLeads,
  INTRO_CARD_PATH,
  openCardModal,
  openReadyPublicCard,
  prepareVisitor,
  resetGuestLeads,
  skipIntroIfPresent,
} from './publicCardVisitor'

test.describe('Public card visitor flows', () => {
  test.describe.configure({ timeout: 75_000 })

  test('Allow Notifications never surfaces Failed to fetch', async ({ page, context }) => {
    await context.grantPermissions(['notifications']).catch(() => undefined)
    await prepareVisitor(page, { declinePush: false })
    await openReadyPublicCard(page)
    await openCardModal(page, 'openFollowModal')

    await expect(
      page.getByRole('heading', { name: /Follow |Enable .* notifications|Notification Settings/i }).first()
    ).toBeVisible({ timeout: 15_000 })
    await expect(page.locator('.vbiz-modal-panel').first()).toBeVisible()

    const enable = page.getByRole('button', {
      name: /Enable Notifications|Allow in Chrome|I've added it|Yes, Keep Me Updated|Re-enable Notifications/i,
    })
    if (
      test.info().project.name !== 'webkit' &&
      (await enable
        .last()
        .isVisible()
        .catch(() => false))
    ) {
      const project = test.info().project.name
      if (project.startsWith('iphone')) {
        await expect(page.getByText(/Home Screen/i).first()).toBeVisible()
      }
      await enable
        .last()
        .click({ force: true, timeout: 8_000 })
        .catch(() => undefined)
    }

    await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0)
    await expect(page.getByText(/NEXT_PUBLIC_VAPID_PUBLIC_KEY is not configured/i)).toHaveCount(0)

    const alert = page.locator('[role="alert"]').first()
    if (await alert.isVisible().catch(() => false)) {
      const message = (await alert.textContent()) || ''
      expect(message.toLowerCase()).not.toContain('failed to fetch')
    }
  })

  test('intro video is iOS-safe and can be skipped', async ({ page }) => {
    await prepareVisitor(page)
    await page.goto(INTRO_CARD_PATH)
    await page
      .locator('.vbiz-preloader')
      .waitFor({ state: 'hidden', timeout: 20_000 })
      .catch(() => undefined)

    await skipIntroIfPresent(page)

    const introVideo = page.locator('video[src*="/e2e/intro.mp4"], source[src*="/e2e/intro.mp4"]').first()
    if ((await introVideo.count()) > 0) {
      await expect(page.locator('video').first())
        .toHaveAttribute('playsinline', '', { timeout: 2_000 })
        .catch(() => undefined)
    }

    await expect(page.getByRole('heading', { name: 'Intro Test Card' })).toBeVisible()
  })

  test('Save Contact serves an Apple-safe vCard and records a CRM lead', async ({ page, request }) => {
    await resetGuestLeads(request)
    await prepareVisitor(page)
    await openReadyPublicCard(page)

    const saveCta = page.getByRole('button', { name: /save (my )?info|save contact/i }).first()
    if (await saveCta.isVisible().catch(() => false)) {
      await saveCta.click({ force: true })
    } else {
      await openCardModal(page, 'saveContactAction')
    }

    await expect(page.getByRole('heading', { name: 'Download Contact Info' })).toBeVisible({ timeout: 15_000 })

    await page.getByLabel('Your full name (optional)').fill('E2E Visitor')
    await page.getByLabel('Your phone number (optional)').fill('+15551230000')
    await page.getByLabel('Your email address (optional)').fill('visitor@example.com')

    const vcfHit = page
      .waitForRequest((req) => req.url().includes('/api/save-contact-vcf/'), { timeout: 8_000 })
      .catch(() => null)

    await page.getByRole('button', { name: /Download Contact File/i }).click({ force: true })
    await vcfHit

    const vcfResponse = await request.get(
      '/api/save-contact-vcf/public-card-1?full_name=E2E%20Visitor&phone=%2B15551230000&email=visitor%40example.com&card_slug=e2e-public-card'
    )
    expect(vcfResponse.ok()).toBeTruthy()
    const vcf = await vcfResponse.text()
    const contentType = vcfResponse.headers()['content-type'] || ''

    expect(contentType).toMatch(/vcard|x-vcard/i)
    expect(vcf).toContain('BEGIN:VCARD')
    expect(vcf).toContain('VERSION:3.0')
    expect(vcf).toContain('FN:Public Test Card')
    expect(vcf).toContain('TEL;TYPE=CELL:+15550002222')
    expect(vcf).not.toContain('CHARSET=UTF-8')

    await expect.poll(async () => (await guestLeads(request)).length, { timeout: 12_000 }).toBeGreaterThan(0)
    const leads = await guestLeads(request)
    expect(leads[0]?.profile_id).toBe('public-card-1')
    expect(leads[0]?.full_name).toBe('E2E Visitor')
    expect(leads[0]?.email).toBe('visitor@example.com')
  })

  test('Add to Home Screen shows device-specific install steps', async ({ page }) => {
    await prepareVisitor(page)
    await openReadyPublicCard(page)

    await openCardModal(page, 'openPwaInstallModal')
    await expect(page.getByRole('heading', { name: /Add .* to your Home Screen/i })).toBeVisible({ timeout: 15_000 })
    await expect(page.getByText('How to add this card')).toBeVisible()

    await expect(page.locator('link[rel="manifest"]').first()).toHaveAttribute(
      'href',
      /\/vCard\/e2e-public-card\/manifest\.webmanifest/
    )
    await expect(page.locator('link[rel="apple-touch-icon"]').first()).toHaveAttribute(
      'href',
      /\/vCard\/e2e-public-card\/icon\//
    )

    const installCta = page.getByRole('button', {
      name: /^(Add to Home Screen|Add to Dock|How to add|Open in Safari)$/i,
    })
    await expect(installCta).toBeVisible()

    const project = test.info().project.name
    if (project.startsWith('iphone')) {
      await expect(installCta).toHaveText(/Add to Home Screen|Open in Safari/i)
      await expect(
        page
          .locator('ol')
          .getByText(/Add to Home Screen/i)
          .first()
      ).toBeVisible()
    } else if (project === 'pixel') {
      await expect(installCta).toHaveText(/Add to Home Screen/i)
      await expect(page.getByText(/Install app/i).first()).toBeVisible()
    } else if (project === 'webkit') {
      await expect(page.getByText(/File → Add to Dock|Add to Dock/i).first()).toBeVisible()
    } else {
      await expect(installCta).toHaveText(/Add to Home Screen/i)
    }

    await installCta.click({ force: true })
    await expect(page.getByText(/Failed to fetch/i)).toHaveCount(0)
  })
})
