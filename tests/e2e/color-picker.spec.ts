import { expect, test } from '@playwright/test'

const WIDTHS = [320, 360, 375, 390, 414, 768, 1024, 1280, 1440, 1920]

async function openDetails(page: import('@playwright/test').Page, name = 'Primary color') {
  await page.getByRole('button', { name }).click()
  const panel = page.locator('[data-color-picker-panel]')
  await panel.getByRole('button', { name: 'Show Colors...' }).click()
  return panel
}

test.describe('custom color picker', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/color-picker')
  })

  test('selects, edits, saves, and reloads primary without touching secondary', async ({ page }) => {
    await expect(page.locator('input[type="color"]')).toHaveCount(0)
    const panel = await openDetails(page)
    await expect(panel).toBeVisible()
    const hex = panel.getByRole('textbox', { name: 'Primary hex' })
    await hex.fill('#445566')
    await hex.press('Enter')
    await expect(page.getByTestId('saved-colors')).toContainText('#445566')
    await expect(page.getByTestId('saved-colors')).toContainText('#eed677')
    await page.keyboard.press('Escape')
    await expect(panel).toHaveCount(0)
    await page.getByRole('button', { name: 'Save colors' }).click()
    await page.reload()
    await expect(page.getByTestId('saved-colors')).toContainText('#445566 #eed677')
  })

  test('rejects an unfinished hex and accepts an rgb channel', async ({ page }) => {
    const panel = await openDetails(page)
    await panel.getByRole('textbox', { name: 'Primary hex' }).fill('#12')
    await expect(page.getByTestId('saved-colors')).toContainText('#112233')
    await panel.getByRole('textbox', { name: 'Primary red' }).fill('10')
    await expect(page.getByTestId('saved-colors')).toContainText('#0a')
    await page.getByRole('button', { name: 'Secondary color' }).click()
    await expect(page.locator('[data-color-picker-panel]')).toHaveCount(1)
    await expect(page.getByTestId('saved-colors')).toContainText('#eed677')
  })

  test('stays inside the viewport and switches to a sheet on a phone', async ({ page }) => {
    for (const width of WIDTHS) {
      const height = width < 500 ? 700 : width < 900 ? 1024 : 900
      await page.setViewportSize({ width, height })
      await page.getByRole('button', { name: 'Primary color' }).click()
      const panel = page.locator('[data-color-picker-panel]')
      await expect(panel).toBeVisible()
      const box = await panel.boundingBox()
      expect(box).not.toBeNull()
      expect(box!.x).toBeGreaterThanOrEqual(-1)
      expect(box!.x + box!.width).toBeLessThanOrEqual(width + 1)
      if (width < 640) await expect(panel).toHaveAttribute('data-placement', 'sheet')
      await page.keyboard.press('Escape')
    }
  })

  test('opens upward from the bottom edge and supports landscape', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.getByRole('button', { name: 'Edge color' }).click()
    await expect(page.locator('[data-color-picker-panel]')).toHaveAttribute('data-placement', 'above')
    await page.keyboard.press('Escape')
    await page.setViewportSize({ width: 844, height: 390 })
    await page.getByRole('button', { name: 'Primary color' }).click()
    await expect(page.locator('[data-color-picker-panel]')).toHaveAttribute('data-placement', 'sheet')
  })

  test('selects a swatch without a screen picker or preset list', async ({ page }) => {
    await page.getByRole('button', { name: 'Primary color' }).click()
    const panel = page.locator('[data-color-picker-panel]')
    await expect(panel.getByRole('button', { name: 'Pick' })).toHaveCount(0)
    await expect(panel.getByText('Presets')).toHaveCount(0)
    await expect(panel.getByText('Recent')).toHaveCount(0)
    await panel.getByRole('option', { name: '#ff0000' }).click()
    await expect(page.getByTestId('saved-colors')).toContainText('#ff0000')
  })
})
