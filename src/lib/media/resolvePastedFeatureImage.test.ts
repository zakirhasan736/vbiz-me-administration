import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const uploadMediaWithProgress = vi.fn()

vi.mock('@/lib/media/uploadMediaWithProgress', () => ({
  uploadMediaWithProgress: (...args: unknown[]) => uploadMediaWithProgress(...args),
}))

vi.mock('@/lib/media/displayImageSrc', () => ({
  displayImageSrc: (url: string) =>
    url.includes('blocked.example') ? `/api/remote-image?url=${encodeURIComponent(url)}` : url,
}))

import { canLoadAsImage, resolvePastedFeatureImage } from '@/lib/media/resolvePastedFeatureImage'

let imageLoads = true
const RealImage = window.Image

beforeEach(() => {
  imageLoads = true
  uploadMediaWithProgress.mockReset()
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
  vi.unstubAllGlobals()
})

describe('resolvePastedFeatureImage', () => {
  it('returns the pasted URL when it loads as an image', async () => {
    const next = await resolvePastedFeatureImage('https://cdn.example.com/photo.jpg')
    expect(next).toEqual({ imageUrl: 'https://cdn.example.com/photo.jpg', source: 'direct' })
  })

  it('scrapes Open Graph when the page URL is not a direct image', async () => {
    imageLoads = false
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/link-preview')) {
        imageLoads = true
        return new Response(
          JSON.stringify({
            url: 'https://pixieset.example/album',
            title: 'Album',
            description: '',
            image: 'https://cdn.example.com/og.jpg',
            siteName: 'Pixieset',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        )
      }
      if (url.includes('/api/remote-image')) {
        return new Response(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), {
          status: 200,
          headers: { 'Content-Type': 'image/jpeg' },
        })
      }
      return new Response('{}', { status: 404 })
    })
    vi.stubGlobal('fetch', fetchMock)
    uploadMediaWithProgress.mockResolvedValue({ url: 'https://media.vbizme.com/hosted.jpg' })

    const next = await resolvePastedFeatureImage('https://pixieset.example/album', {
      profileId: '42',
      attachmentType: 'About Me Featured',
    })

    expect(next?.source).toBe('hosted')
    expect(next?.imageUrl).toBe('https://media.vbizme.com/hosted.jpg')
    expect(next?.preview?.image).toBe('https://cdn.example.com/og.jpg')
    expect(uploadMediaWithProgress).toHaveBeenCalled()
  })

  it('falls back to the Open Graph URL when re-host is unavailable', async () => {
    imageLoads = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('/api/link-preview')) {
          imageLoads = true
          return new Response(
            JSON.stringify({
              url: 'https://share.example/post',
              title: 'Post',
              description: '',
              image: 'https://cdn.example.com/share-og.png',
              siteName: 'Share',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } }
          )
        }
        return new Response('{}', { status: 404 })
      })
    )

    const next = await resolvePastedFeatureImage('https://share.example/post')
    expect(next).toEqual({
      imageUrl: 'https://cdn.example.com/share-og.png',
      source: 'og',
      preview: {
        url: 'https://share.example/post',
        title: 'Post',
        description: '',
        image: 'https://cdn.example.com/share-og.png',
        siteName: 'Share',
      },
    })
  })

  it('returns null when neither direct load nor Open Graph image works', async () => {
    imageLoads = false
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ error: 'nope' }), { status: 502 }))
    )
    expect(await resolvePastedFeatureImage('https://example.com/no-image')).toBeNull()
  })
})

describe('canLoadAsImage', () => {
  it('is true when the probe image loads', async () => {
    expect(await canLoadAsImage('https://cdn.example.com/a.png')).toBe(true)
  })

  it('is false when the probe image errors', async () => {
    imageLoads = false
    expect(await canLoadAsImage('https://cdn.example.com/missing.png')).toBe(false)
  })
})
