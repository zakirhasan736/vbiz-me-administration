import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
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
    assert.equal(isPersistableMediaUrl('blob:http://localhost/abc'), false)
    assert.equal(isPersistableMediaUrl('https://cdn.example.com/a.jpg'), true)
    assert.equal(isPersistableMediaUrl(''), false)
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
    assert.equal(parsed.gallery.length, 1)
    assert.equal(parsed.gallery[0]?.id, '2')
    assert.equal(parsed.gallery[0]?.size, 1200)
    assert.equal(parsed.videos.length, 1)
    assert.equal(parsed.videos[0]?.id, 'v2')
    assert.equal(parsed.note, 'Hello')
  })

  it('hasContentMediaContent ignores blob-only media', () => {
    assert.equal(
      hasContentMediaContent({
        gallery: [{ id: '1', url: 'blob:http://localhost/x', name: 'x' }],
        videos: [],
        note: '',
      }),
      false
    )
    assert.equal(
      hasContentMediaContent({
        gallery: [{ id: '1', url: 'https://cdn.example.com/g.jpg', name: 'g' }],
        videos: [],
        note: '',
      }),
      true
    )
  })

  it('normalizes size and type on gallery items', () => {
    const normalized = normalizeVCardContentMedia({
      gallery: [{ id: '1', url: 'https://cdn.example.com/g.jpg', name: 'g', size: 42, type: 'image/png' }],
      videos: [],
      note: '',
    })
    assert.equal(normalized.gallery[0]?.size, 42)
    assert.equal(normalized.gallery[0]?.type, 'image/png')
  })

  it('hides raw upload filenames from public video captions', () => {
    assert.equal(getContentMediaVideoDisplayTitle('WhatsApp Video 2026-09-06 at 4.22.14 PM.mp4'), null)
    assert.equal(getContentMediaVideoDisplayTitle('clip.mov'), null)
    assert.equal(getContentMediaVideoDisplayTitle('Video'), null)
    assert.equal(getContentMediaVideoDisplayTitle(''), null)
    assert.equal(getContentMediaVideoDisplayTitle('Product demo'), 'Product demo')
  })
})
