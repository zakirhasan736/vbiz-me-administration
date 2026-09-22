import { expect, test } from '@playwright/test'
import { openReadyPublicCard, prepareVisitor } from './publicCardVisitor'

test.describe('Public card rich text', () => {
  test('About Me renders builder typography from the API', async ({ page }) => {
    await prepareVisitor(page)
    await openReadyPublicCard(page)

    await page.getByRole('tab', { name: 'About Me' }).click()

    const rich = page.locator('.vcard-rich-html').filter({ hasText: 'Heading One' }).first()
    await expect(rich.locator('h1')).toBeVisible()
    const seeMore = page.getByRole('button', { name: 'See more' })
    await seeMore
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => seeMore.click())
      .catch(() => undefined)
    await expect(rich).toBeVisible()
    await expect(rich.locator('h1')).toHaveText('Heading One')
    await expect(rich.locator('h2')).toHaveText('Heading Two')
    await expect(rich.locator('h3')).toHaveText('Heading Three')
    await expect(rich.locator('h4')).toHaveText('Heading Four')
    await expect(rich.locator('h5')).toHaveText('Heading Five')
    await expect(rich.locator('h6')).toHaveText('Heading Six')
    await expect(rich.locator('strong')).toHaveText('bold')
    await expect(rich.locator('em')).toHaveText('italic')
    await expect(rich.locator('u')).toHaveText('underline')
    await expect(rich.locator('ul li')).toHaveText('Bullet item')
    await expect(rich.locator('ol li')).toHaveText('Numbered item')
    await expect(rich.locator('a')).toHaveAttribute('href', 'https://example.com/rich')
    await expect(rich.locator('p code')).toHaveText('inlineCode')
    await expect(rich.locator('pre code')).toHaveText('code block')

    const styles = await rich.evaluate((root) => {
      const read = (selector: string) => {
        const el = root.querySelector(selector)
        if (!el) return null
        const style = getComputedStyle(el)
        return {
          fontSize: Number.parseFloat(style.fontSize),
          fontWeight: Number.parseInt(style.fontWeight, 10),
          fontStyle: style.fontStyle,
          textDecoration: style.textDecorationLine,
          listStyle: style.listStyleType,
          color: style.color,
        }
      }
      return {
        h1: read('h1'),
        h6: read('h6'),
        strong: read('strong'),
        em: read('em'),
        underline: read('u'),
        ul: read('ul'),
        ol: read('ol'),
      }
    })

    expect(styles.h1?.fontSize ?? 0).toBeGreaterThan(styles.h6?.fontSize ?? 0)
    expect(styles.h1?.fontWeight).toBeGreaterThanOrEqual(700)
    expect(styles.strong?.fontWeight).toBeGreaterThanOrEqual(700)
    expect(styles.em?.fontStyle).toBe('italic')
    expect(styles.underline?.textDecoration).toContain('underline')
    expect(styles.ul?.listStyle).toBe('disc')
    expect(styles.ol?.listStyle).toBe('decimal')
    expect(styles.strong?.color).toBe('rgb(234, 179, 8)')
  })
})
