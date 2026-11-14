import { MediaFileUploader, type MediaUploadResult } from '@/components/media/MediaFileUploader'
import { act, type ReactNode } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mounted: Array<{ root: Root; host: HTMLElement }> = []

function render(node: ReactNode): HTMLElement {
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  act(() => root.render(node))
  mounted.push({ root, host })
  return host
}

/** Pasted extensionless image links are probed with an <img> before they are accepted. */
let imageLoads = true
const RealImage = window.Image

beforeEach(() => {
  imageLoads = true
  class ProbeImage {
    onload: (() => void) | null = null
    onerror: (() => void) | null = null
    referrerPolicy = ''
    naturalWidth = 0
    set src(_url: string) {
      queueMicrotask(() => {
        if (imageLoads) {
          this.naturalWidth = 640
          this.onload?.()
        } else {
          this.onerror?.()
        }
      })
    }
  }
  window.Image = ProbeImage as unknown as typeof window.Image
})

afterEach(() => {
  window.Image = RealImage
  for (const { root, host } of mounted.splice(0)) {
    act(() => root.unmount())
    host.remove()
  }
})

/** Type into a React-controlled input and press Enter, then let any image probe settle. */
async function pasteAndEnter(host: HTMLElement, text: string) {
  const input = host.querySelector<HTMLInputElement>('input[type="url"]')
  if (!input) throw new Error('URL input not rendered')
  const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
  act(() => {
    setValue.call(input, text)
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await act(async () => {
    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe('MediaFileUploader paste URL', () => {
  it('applies a pasted image URL on Enter', async () => {
    const onChange = vi.fn<(next: MediaUploadResult | null) => void>()
    const host = render(<MediaFileUploader onChange={onChange} accept="image/*,video/*" />)
    await pasteAndEnter(host, 'https://cdn.example.com/team.jpg')
    expect(onChange).toHaveBeenCalledWith({ url: 'https://cdn.example.com/team.jpg', fileName: 'team.jpg' })
  })

  it('applies an extensionless image CDN URL after the load probe succeeds', async () => {
    const onChange = vi.fn<(next: MediaUploadResult | null) => void>()
    const host = render(<MediaFileUploader onChange={onChange} accept="image/*" />)
    await pasteAndEnter(host, 'https://lh3.googleusercontent.com/abc123')
    expect(onChange).toHaveBeenCalledWith({
      url: 'https://lh3.googleusercontent.com/abc123',
      fileName: 'abc123',
      mimeType: 'image/*',
    })
  })

  it('accepts a YouTube link in an image-or-video field', async () => {
    const onChange = vi.fn()
    const host = render(<MediaFileUploader onChange={onChange} accept="image/*,video/*" />)
    await pasteAndEnter(host, 'https://youtu.be/GghZCyc_fnU')
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('rejects text that is not a link', async () => {
    const onChange = vi.fn()
    const host = render(<MediaFileUploader onChange={onChange} accept="image/*" />)
    await pasteAndEnter(host, 'my photo')
    expect(onChange).not.toHaveBeenCalled()
    expect(host.textContent).toContain('Paste a full link that starts with https://')
  })

  it('rejects a video link in an image-only field', async () => {
    const onChange = vi.fn()
    const host = render(<MediaFileUploader onChange={onChange} accept="image/*" />)
    await pasteAndEnter(host, 'https://cdn.example.com/intro.mp4')
    expect(onChange).not.toHaveBeenCalled()
    expect(host.textContent).toContain('This field needs an image URL.')
  })

  it('uses the Open Graph image when a page URL is not a direct image file', async () => {
    imageLoads = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/link-preview')) {
        imageLoads = true
        return new Response(
          JSON.stringify({
            url: 'https://gallery.example/album',
            title: 'Album',
            description: '',
            image: 'https://cdn.example.com/og-cover.jpg',
            siteName: 'Gallery',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)

    const onChange = vi.fn<(next: MediaUploadResult | null) => void>()
    const host = render(<MediaFileUploader onChange={onChange} accept="image/*" />)
    await pasteAndEnter(host, 'https://gallery.example/album')
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 20))
    })

    expect(onChange).toHaveBeenCalledWith({
      url: 'https://cdn.example.com/og-cover.jpg',
      fileName: 'og-cover.jpg',
      mimeType: 'image/*',
    })
    vi.unstubAllGlobals()
  })

  it('previews a pasted YouTube link as a player and an extensionless image as an image', () => {
    const yt = render(
      <MediaFileUploader onChange={vi.fn()} accept="image/*,video/*" value="https://youtu.be/GghZCyc_fnU" />
    )
    expect(yt.querySelector('iframe')?.getAttribute('src')).toBe('https://www.youtube.com/embed/GghZCyc_fnU')

    const img = render(
      <MediaFileUploader onChange={vi.fn()} accept="image/*" value="https://lh3.googleusercontent.com/abc123" />
    )
    expect(img.textContent?.toLowerCase()).toContain('image')
    expect(img.querySelector('iframe')).toBeNull()
  })
})
