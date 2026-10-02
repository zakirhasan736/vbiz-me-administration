import { expect, test } from '@playwright/test'
import { INTRO_CARD_PATH, openReadyPublicCard, prepareVisitor, skipIntroIfPresent } from './publicCardVisitor'

test.describe('iPhone share links + video audio', () => {
  test.describe.configure({ timeout: 90_000 })

  test('Share modal Facebook href includes the public card URL', async ({ page }) => {
    await prepareVisitor(page)
    await openReadyPublicCard(page)

    await page.evaluate(() => window.dispatchEvent(new CustomEvent('openShareModal')))
    const panel = page.locator('.vbiz-modal-panel').first()
    await expect(panel).toBeVisible({ timeout: 8_000 })

    const facebook = panel.getByRole('link', { name: /Share on Facebook/i })
    await expect(facebook).toBeVisible()
    const href = (await facebook.getAttribute('href')) || ''
    expect(href).toContain('facebook.com/sharer')
    expect(decodeURIComponent(href)).toContain('/vCard/')
    expect(href).toMatch(/[?&]u=/)
    expect(href).toMatch(/[?&]quote=/)

    // Gesture-open path should fire without throwing (popup may be blocked in automation).
    await facebook.click()
    await expect(panel).toBeVisible()
  })

  test('intro unmute keeps video.muted false after tap', async ({ page }) => {
    await prepareVisitor(page)
    await page.goto(INTRO_CARD_PATH)

    const introVideo = page.locator('video[data-intro-quality]').first()
    const hasIntro = await introVideo
      .waitFor({ state: 'attached', timeout: 20_000 })
      .then(() => true)
      .catch(() => false)

    if (!hasIntro) {
      test.info().annotations.push({ type: 'note', description: 'No intro video on mock card' })
      return
    }

    // Start playback if Low Power / autoplay blocked the intro.
    const tapToPlay = page.getByRole('button', { name: /Tap to play intro|Loading intro/i })
    if (await tapToPlay.isVisible().catch(() => false)) {
      await tapToPlay.click({ force: true })
      await page.waitForTimeout(300)
    }

    const unmute = page.getByRole('button', { name: /Unmute intro video/i })
    await expect(unmute).toBeVisible({ timeout: 20_000 })
    await unmute.click({ force: true })
    await page.waitForTimeout(400)

    const state = await page.evaluate(() => {
      const video = document.querySelector('video[data-intro-quality]') as HTMLVideoElement | null
      if (!video) return null
      return {
        muted: video.muted,
        hasMutedAttr: video.hasAttribute('muted'),
        playsInline: video.playsInline || video.hasAttribute('playsinline'),
      }
    })

    expect(state).not.toBeNull()
    expect(state?.playsInline).toBe(true)
    expect(state?.muted).toBe(false)
    expect(state?.hasMutedAttr).toBe(false)

    // Retry loop must not remute after a short wait.
    await page.waitForTimeout(900)
    const stillUnmuted = await page.evaluate(() => {
      const video = document.querySelector('video[data-intro-quality]') as HTMLVideoElement | null
      return video ? !video.muted && !video.hasAttribute('muted') : false
    })
    expect(stillUnmuted).toBe(true)

    await skipIntroIfPresent(page)
  })

  test('home profile video exposes unmute control on touch', async ({ page }) => {
    await prepareVisitor(page)
    await openReadyPublicCard(page)

    const unmute = page.getByRole('button', { name: /Unmute video/i }).first()
    const present = await unmute
      .waitFor({ state: 'visible', timeout: 8_000 })
      .then(() => true)
      .catch(() => false)

    if (!present) {
      test.info().annotations.push({ type: 'note', description: 'No profile video on mock card — skip unmute assert' })
      return
    }

    await unmute.click()
    const muted = await page.evaluate(() => {
      const video = document.querySelector('.vbiz-profile-root video') as HTMLVideoElement | null
      return video?.muted ?? true
    })
    expect(muted).toBe(false)
  })
})
