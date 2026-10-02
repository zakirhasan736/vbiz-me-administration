import { describe, expect, it } from 'vitest'
import {
  CONTENT_MEDIA_SETTING_KEY,
  getContentMediaVideoDisplayTitle,
  hasContentMediaContent,
  isPersistableMediaUrl,
  mapContentMediaToApiSettings,
  normalizeVCardContentMedia,
} from './vcardContentMedia'

describe('vcardContentMedia', () => {
  it('rejects blob URLs as non-persistable', () => {
    expect(isPersistableMediaUrl('blob:http://localhost/abc')).toBe(false)
    expect(isPersistableMediaUrl('https://cdn.example.com/a.jpg')).toBe(true)
    expect(isPersistableMediaUrl('')).toBe(false)
  })

  it('strips blob gallery and video URLs when mapping to API settings', () => {
    const settings = mapContentMediaToApiSettings({
      gallery: [
        { id: '1', url: 'blob:http://localhost/x', name: 'local.jpg' },
        { id: '2', url: 'https://cdn.example.com/g.jpg', name: 'g.jpg', size: 1200, type: 'image/jpeg' },
      ],
      videos: [
        { id: 'v1', title: 'Local', url: 'blob:http://localhost/v' },
        { id: 'v2', title: 'Remote', url: 'https://youtu.be/abc123' },
      ],
      note: 'Hello',
    })
    const parsed = JSON.parse(settings[CONTENT_MEDIA_SETTING_KEY]!) as {
      gallery: Array<{ id: string; size?: number }>
      videos: Array<{ id: string }>
      note: string
    }
    expect(parsed.gallery).toHaveLength(1)
    expect(parsed.gallery[0]?.id).toBe('2')
    expect(parsed.gallery[0]?.size).toBe(1200)
    expect(parsed.videos).toHaveLength(1)
    expect(parsed.videos[0]?.id).toBe('v2')
    expect(parsed.note).toBe('Hello')
  })

  it('hasContentMediaContent ignores blob-only media', () => {
    expect(
      hasContentMediaContent({
        gallery: [{ id: '1', url: 'blob:http://localhost/x', name: 'x' }],
        videos: [],
        note: '',
      })
    ).toBe(false)
    expect(
      hasContentMediaContent({
        gallery: [{ id: '1', url: 'https://cdn.example.com/g.jpg', name: 'g' }],
        videos: [],
        note: '',
      })
    ).toBe(true)
  })

  it('normalizes size and type on gallery items', () => {
    const normalized = normalizeVCardContentMedia({
      gallery: [{ id: '1', url: 'https://cdn.example.com/g.jpg', name: 'g', size: 42, type: 'image/png' }],
      videos: [],
      note: '',
    })
    expect(normalized.gallery[0]?.size).toBe(42)
    expect(normalized.gallery[0]?.type).toBe('image/png')
  })

  it('hides raw upload filenames from public video captions', () => {
    expect(getContentMediaVideoDisplayTitle('WhatsApp Video 2026-09-06 at 4.22.14 PM.mp4')).toBeNull()
    expect(getContentMediaVideoDisplayTitle('clip.mov')).toBeNull()
    expect(getContentMediaVideoDisplayTitle('Video')).toBeNull()
    expect(getContentMediaVideoDisplayTitle('')).toBeNull()
    expect(getContentMediaVideoDisplayTitle('Product demo')).toBe('Product demo')
  })
})
