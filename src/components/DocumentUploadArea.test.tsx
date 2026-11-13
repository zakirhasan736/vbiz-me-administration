import { DocumentUploadArea, type UploadedDoc } from '@/components/DocumentUploadArea'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/components/MediaSourceActions', () => ({ MediaSourceActions: () => null }))

const mounted: Array<{ root: Root; host: HTMLElement }> = []

function render(node: ReactNode): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(node))
  mounted.push({ root, host })
  return host
}

afterEach(() => {
  for (const { root, host } of mounted.splice(0)) {
    act(() => root.unmount())
    host.remove()
  }
})

function pasteAndEnter(host: HTMLElement, text: string) {
  const input = host.querySelector<HTMLInputElement>('input[type="url"]')
  if (!input) throw new Error('URL input not rendered')
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  act(() => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  })
}

describe('DocumentUploadArea image URL paste', () => {
  it('is off unless urlPaste is set (certificates, resume)', () => {
    const host = render(<DocumentUploadArea files={[]} onChange={vi.fn()} />)
    expect(host.querySelector('input[type="url"]')).toBeNull()
  })

  it('adds a pasted image link to the gallery', () => {
    const onChange = vi.fn<(files: UploadedDoc[]) => void>()
    const existing: UploadedDoc = {
      id: 'a',
      name: 'a.jpg',
      url: 'https://cdn.example.com/a.jpg',
      type: 'image/jpeg',
      size: 1,
    }
    const host = render(<DocumentUploadArea files={[existing]} onChange={onChange} urlPaste />)
    pasteAndEnter(host, 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200')
    const next = onChange.mock.calls[0]?.[0]
    expect(next).toHaveLength(2)
    expect(next?.[1]).toMatchObject({
      url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=1200',
      name: 'photo-1550684848-fac1c5b4e853',
      type: 'image/*',
    })
  })

  it('rejects video links and duplicates', () => {
    const onChange = vi.fn()
    const existing: UploadedDoc = {
      id: 'a',
      name: 'a.jpg',
      url: 'https://cdn.example.com/a.jpg',
      type: 'image/jpeg',
      size: 1,
    }
    const host = render(<DocumentUploadArea files={[existing]} onChange={onChange} urlPaste />)
    pasteAndEnter(host, 'https://cdn.example.com/intro.mp4')
    expect(host.textContent).toContain('This field needs an image URL.')
    pasteAndEnter(host, 'https://cdn.example.com/a.jpg')
    expect(host.textContent).toContain('That image is already in the list.')
    expect(onChange).not.toHaveBeenCalled()
  })
})
