import { CustomColorPicker } from '@/components/color/CustomColorPicker'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'

function renderPicker(node: ReactNode) {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => {
    root.render(node)
  })
  return {
    host,
    root,
    cleanup() {
      act(() => root.unmount())
      host.remove()
    },
  }
}

describe('CustomColorPicker', () => {
  const mounted: Array<{ root: Root; host: HTMLElement }> = []

  afterEach(() => {
    for (const item of mounted) {
      act(() => item.root.unmount())
      item.host.remove()
    }
    mounted.length = 0
    document.body.innerHTML = ''
  })

  it('opens a custom panel and never mounts a native color input', () => {
    const view = renderPicker(<CustomColorPicker label="Primary" defaultValue="#112233" />)
    mounted.push(view)
    const trigger = document.querySelector('button[aria-label="Primary color"]') as HTMLButtonElement
    act(() => trigger.click())
    expect(document.querySelector('input[type="color"]')).toBeNull()
    expect(document.querySelector('[data-color-picker-panel]')).toBeTruthy()
    expect(document.body.textContent).toContain('Show Colors...')
    const showColors = Array.from(document.querySelectorAll('button')).find((button) =>
      button.textContent?.includes('Show Colors')
    ) as HTMLButtonElement
    act(() => showColors.click())
    const hex = document.querySelector('input[aria-label="Primary hex"]') as HTMLInputElement
    expect(hex.value.toLowerCase()).toContain('112233')
  })

  it('keeps primary and secondary independent and ignores an unfinished hex', () => {
    let primary = '#112233'
    let secondary = '#eed677'
    const view = renderPicker(
      <>
        <CustomColorPicker label="Primary" value={primary} onChange={(hex) => (primary = hex)} />
        <CustomColorPicker label="Secondary" value={secondary} onChange={(hex) => (secondary = hex)} />
      </>
    )
    mounted.push(view)
    act(() => (document.querySelector('button[aria-label="Primary color"]') as HTMLButtonElement).click())
    act(() =>
      (
        Array.from(document.querySelectorAll('button')).find((button) =>
          button.textContent?.includes('Show Colors')
        ) as HTMLButtonElement
      ).click()
    )
    const hex = document.querySelector('input[aria-label="Primary hex"]') as HTMLInputElement
    act(() => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')?.set
      setter?.call(hex, '#ff')
      hex.dispatchEvent(new Event('input', { bubbles: true }))
      hex.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(primary).toBe('#112233')
    expect(secondary).toBe('#eed677')
  })

  it('closes on Escape and restores the selected color when reopened', () => {
    const view = renderPicker(<CustomColorPicker label="Primary" defaultValue="#abcdef" />)
    mounted.push(view)
    const open = () =>
      act(() => (document.querySelector('button[aria-label="Primary color"]') as HTMLButtonElement).click())
    open()
    act(() => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }))
    })
    expect(document.querySelector('[data-color-picker-panel]')).toBeNull()
    open()
    act(() =>
      (
        Array.from(document.querySelectorAll('button')).find((button) =>
          button.textContent?.includes('Show Colors')
        ) as HTMLButtonElement
      ).click()
    )
    const hex = document.querySelector('input[aria-label="Primary hex"]') as HTMLInputElement
    expect(hex.value.toLowerCase()).toContain('abcdef')
  })

  it('omits the eyedropper, presets, and recent colors', () => {
    const view = renderPicker(<CustomColorPicker label="Primary" defaultValue="#000000" />)
    mounted.push(view)
    act(() => (document.querySelector('button[aria-label="Primary color"]') as HTMLButtonElement).click())
    const panel = document.querySelector('[data-color-picker-panel]')
    expect(panel).toBeTruthy()
    expect(panel?.textContent).not.toMatch(/Pick|Presets|Recent|Done/)
  })
})
