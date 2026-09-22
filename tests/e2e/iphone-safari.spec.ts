import { expect, test } from '@playwright/test'
import { MOCK_API, openReadyPublicCard, prepareVisitor } from './publicCardVisitor'

test.describe('iPhone Safari compatibility', () => {
  test.describe.configure({ timeout: 60_000 })

  test('public card stays free of Safari crashes and uses iOS-safe APIs', async ({ page }) => {
    const project = test.info().project.name
    const pageErrors: string[] = []
    const consoleErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))
    page.on('console', (message) => {
      if (message.type() === 'error') consoleErrors.push(message.text())
    })

    await prepareVisitor(page)
    await openReadyPublicCard(page)

    const about = page.getByRole('tab', { name: 'About Me' })
    await expect(about).toBeVisible()
    await about.click()
    await expect(about).toHaveAttribute('aria-selected', 'true')

    const report = await page.evaluate(async (healthUrl: string) => {
      let notificationThrew = false
      let notificationType = 'missing'
      try {
        notificationType = typeof window.Notification
      } catch {
        notificationThrew = true
      }

      let storageOk = false
      try {
        localStorage.setItem('vbiz_iphone_probe', '1')
        storageOk = localStorage.getItem('vbiz_iphone_probe') === '1'
        localStorage.removeItem('vbiz_iphone_probe')
      } catch {
        storageOk = false
      }

      const root = document.querySelector('.vbiz-profile-root') as HTMLElement | null
      const health = await fetch(healthUrl).then(async (response) => ({
        ok: response.ok,
        status: (await response.json()) as { data?: { status?: string } },
      }))

      return {
        notificationThrew,
        notificationType,
        storageOk,
        touch:
          navigator.maxTouchPoints > 0 || 'ontouchstart' in window || window.matchMedia('(pointer: coarse)').matches,
        ua: navigator.userAgent,
        visualViewport: typeof window.visualViewport?.width === 'number',
        matchMedia: typeof window.matchMedia === 'function',
        overflow:
          root == null ? 0 : root.scrollWidth - Math.max(root.clientWidth, document.documentElement.clientWidth),
        healthOk: health.ok && health.status.data?.status === 'healthy',
        videos: Array.from(document.querySelectorAll('video')).map((video) => video.hasAttribute('playsinline')),
      }
    }, `${MOCK_API}/api/v1/health`)

    const crashText = [...pageErrors, ...consoleErrors].join('\n')
    expect(crashText).not.toMatch(/Can't find variable: Notification|Notification is not defined/i)
    expect(pageErrors, pageErrors.join('\n')).toEqual([])
    expect(report.notificationThrew).toBe(false)
    expect(['function', 'object', 'undefined']).toContain(report.notificationType)
    expect(report.storageOk).toBe(true)
    expect(report.visualViewport).toBe(true)
    expect(report.matchMedia).toBe(true)
    expect(report.healthOk).toBe(true)
    expect(report.overflow).toBeLessThanOrEqual(2)
    expect(report.videos.every(Boolean)).toBe(true)

    if (project.startsWith('iphone')) {
      expect(report.touch).toBe(true)
      expect(report.ua).toMatch(/iPhone/)
      expect(report.ua).toMatch(/Safari/)
    }
  })
})
