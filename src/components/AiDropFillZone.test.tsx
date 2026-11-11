import { AiDropFillZone, type AiFilledResult } from '@/components/AiDropFillZone'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/** Plain stub (not vi.fn) so an intentional AI failure isn't reported by Vitest's mock tracker. */
let fillImpl: (...args: unknown[]) => Promise<unknown> = async () => ({})
const fillCalls: unknown[][] = []

vi.mock('@/lib/assistantApi', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/assistantApi')>()
  return {
    ...actual,
    fillAssistantSection: (...args: unknown[]) => {
      fillCalls.push(args)
      return fillImpl(...args)
    },
  }
})
vi.mock('@/lib/toast/toast', () => ({
  notify: { success: vi.fn(), warning: vi.fn(), error: vi.fn(), info: vi.fn() },
}))

const mounted: Array<{ root: Root; host: HTMLElement }> = []

function render(node: ReactNode): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(node))
  mounted.push({ root, host })
  return host
}

function clickButton(host: HTMLElement, label: RegExp) {
  const button = Array.from(host.querySelectorAll('button')).find((b) => label.test(b.textContent || ''))
  if (!button) throw new Error(`No button matching ${label}`)
  act(() => button.click())
}

function typeInto(el: HTMLTextAreaElement, value: string) {
  const setValue = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!
  act(() => {
    setValue.call(el, value)
    el.dispatchEvent(new Event('input', { bubbles: true }))
  })
}

async function pasteAndFill(host: HTMLElement, text: string) {
  clickButton(host, /Paste text/)
  const textarea = host.querySelector('textarea')
  if (!textarea) throw new Error('No textarea')
  typeInto(textarea, text)
  await act(async () => {
    clickButton(host, /Fill as written/)
  })
}

beforeEach(() => {
  fillCalls.length = 0
  fillImpl = async () => ({})
})

afterEach(() => {
  for (const { root, host } of mounted.splice(0)) {
    act(() => root.unmount())
    host.remove()
  }
})

describe('AiDropFillZone generic sections', () => {
  it('sends the tab context and delivers a single content block', async () => {
    fillImpl = async () => ({
      payload: { content: { title: 'Our Mission', description: '<p>We help families.</p>' } },
    })
    const onFilled = vi.fn<(result: AiFilledResult) => void>()
    const context = { tabName: 'Mission Statement', fields: ['title', 'description'] }
    const host = render(<AiDropFillZone section="content" profileId="card_1" context={context} onFilled={onFilled} />)

    await pasteAndFill(host, 'Our Mission\nWe help families.')

    expect(fillCalls).toEqual([['card_1', 'content', 'Our Mission\nWe help families.', [], 'as_written', context]])
    expect(onFilled).toHaveBeenCalledWith(
      expect.objectContaining({ section: 'content', count: 1, source: 'ai' })
    )
  })

  it('delivers every entry for list tabs', async () => {
    fillImpl = async () => ({
      payload: { entries: [{ title: 'Spring Gala' }, { title: 'Open House' }, { title: 'Holiday Party' }] },
    })
    const onFilled = vi.fn<(result: AiFilledResult) => void>()
    const host = render(
      <AiDropFillZone section="entries" profileId="card_1" context={{ tabName: 'Events' }} onFilled={onFilled} />
    )
    await pasteAndFill(host, 'Spring Gala\n\nOpen House\n\nHoliday Party')
    expect(onFilled.mock.calls[0]?.[0]).toMatchObject({ section: 'entries', count: 3 })
  })

  it('falls back to a local parse for a single block when AI is unavailable', async () => {
    fillImpl = () => Promise.reject(new Error('503 OpenAI unavailable'))
    const onFilled = vi.fn<(result: AiFilledResult) => void>()
    const host = render(
      <AiDropFillZone section="content" profileId="card_1" context={{ tabName: 'About Me' }} onFilled={onFilled} />
    )
    await pasteAndFill(host, 'About Us\nFamily-owned since 1998.')
    expect(onFilled.mock.calls[0]?.[0]).toMatchObject({
      section: 'content',
      source: 'local',
      payload: { content: { title: 'About Us', description: '<p>Family-owned since 1998.</p>' } },
    })
  })
})
