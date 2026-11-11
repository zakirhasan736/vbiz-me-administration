import { describe, expect, it } from 'vitest'
import {
  allowedKindsFromAccept,
  classifyPastedMediaUrl,
  isDirectVideoUrl,
  normalizePastedMediaUrl,
  resolveEmbedVideoUrl,
  validatePastedMediaUrl,
} from './pastedMediaUrl'

const UNSPLASH = 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200'

describe('normalizePastedMediaUrl', () => {
  it('accepts http(s) links and adds https to bare hosts', () => {
    expect(normalizePastedMediaUrl('  https://cdn.example.com/a.jpg ')).toBe('https://cdn.example.com/a.jpg')
    expect(normalizePastedMediaUrl('cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
  })

  it('rejects text that is not a usable link', () => {
    expect(normalizePastedMediaUrl('hello')).toBeNull()
    expect(normalizePastedMediaUrl('')).toBeNull()
    expect(normalizePastedMediaUrl('javascript:alert(1)')).toBeNull()
    expect(normalizePastedMediaUrl('ftp://example.com/a.jpg')).toBeNull()
  })
})

describe('resolveEmbedVideoUrl', () => {
  it('turns YouTube and Vimeo links into player URLs', () => {
    expect(resolveEmbedVideoUrl('https://youtu.be/GghZCyc_fnU')).toBe('https://www.youtube.com/embed/GghZCyc_fnU')
    expect(resolveEmbedVideoUrl('https://www.youtube.com/watch?v=GghZCyc_fnU&t=3')).toBe(
      'https://www.youtube.com/embed/GghZCyc_fnU'
    )
    expect(resolveEmbedVideoUrl('https://vimeo.com/76979871')).toBe('https://player.vimeo.com/video/76979871')
  })

  it('returns null for direct files', () => {
    expect(resolveEmbedVideoUrl('https://cdn.example.com/intro.mp4')).toBeNull()
  })
})

describe('classifyPastedMediaUrl', () => {
  it('classifies each kind of link', () => {
    expect(classifyPastedMediaUrl('https://youtu.be/GghZCyc_fnU')).toBe('embed')
    expect(classifyPastedMediaUrl('https://cdn.example.com/intro.mp4')).toBe('video')
    expect(classifyPastedMediaUrl(UNSPLASH)).toBe('image')
    expect(classifyPastedMediaUrl('https://cdn.example.com/a.png')).toBe('image')
    expect(classifyPastedMediaUrl('https://cdn.example.com/song.mp3')).toBe('audio')
    expect(classifyPastedMediaUrl('https://cdn.example.com/menu.pdf')).toBe('document')
    expect(classifyPastedMediaUrl('https://lh3.googleusercontent.com/abc123')).toBe('unknown')
  })

  it('treats only real files as direct video', () => {
    expect(isDirectVideoUrl('https://cdn.example.com/intro.webm')).toBe(true)
    expect(isDirectVideoUrl('https://youtu.be/GghZCyc_fnU')).toBe(false)
  })
})

describe('validatePastedMediaUrl', () => {
  const imageOnly = allowedKindsFromAccept('image/*')
  const media = allowedKindsFromAccept('image/*,video/*')

  it('reads accept strings', () => {
    expect(imageOnly).toEqual({ image: true, video: false, audio: false, document: false })
    expect(allowedKindsFromAccept('')).toEqual({ image: true, video: true, audio: true, document: true })
    expect(allowedKindsFromAccept('image/*,application/pdf,.pdf,.doc,.docx').document).toBe(true)
  })

  it('lets image fields take images and extensionless CDN links, not videos', () => {
    expect(validatePastedMediaUrl(UNSPLASH, imageOnly)).toBeNull()
    expect(validatePastedMediaUrl('https://lh3.googleusercontent.com/abc123', imageOnly)).toBeNull()
    expect(validatePastedMediaUrl('https://cdn.example.com/intro.mp4', imageOnly)).toBe(
      'This field needs an image URL.'
    )
    expect(validatePastedMediaUrl('https://youtu.be/GghZCyc_fnU', imageOnly)).not.toBeNull()
  })

  it('lets image-or-video fields take both, including YouTube', () => {
    expect(validatePastedMediaUrl('https://youtu.be/GghZCyc_fnU', media)).toBeNull()
    expect(validatePastedMediaUrl('https://cdn.example.com/intro.mp4', media)).toBeNull()
    expect(validatePastedMediaUrl('https://cdn.example.com/song.mp3', media)).toBe(
      'This field needs an image or a video URL.'
    )
  })
})
