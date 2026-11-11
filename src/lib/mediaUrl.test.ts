import { describe, expect, it } from 'vitest'
import { detectGalleryMediaKind, detectPortfolioType, isAudioUrl, isDocumentUrl, isImageUrl, isVideoUrl } from './mediaUrl'

describe('isVideoUrl', () => {
  it('treats uploaded files and Cloudinary video paths as video', () => {
    expect(isVideoUrl('https://cdn.example.com/about.mp4')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/about.m4v?v=1')).toBe(true)
    expect(isVideoUrl('https://res.cloudinary.com/demo/video/upload/v1/about_clip')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/about.jpg')).toBe(false)
  })
})

describe('isAudioUrl', () => {
  it('detects common audio extensions', () => {
    expect(isAudioUrl('https://cdn.example.com/track.mp3')).toBe(true)
    expect(isAudioUrl('https://cdn.example.com/clip.m4a?x=1')).toBe(true)
    expect(isAudioUrl('https://cdn.example.com/photo.jpg')).toBe(false)
  })
})

describe('isDocumentUrl', () => {
  it('detects pdf and office docs', () => {
    expect(isDocumentUrl('https://cdn.example.com/brief.pdf')).toBe(true)
    expect(isDocumentUrl('https://cdn.example.com/doc.docx')).toBe(true)
    expect(isDocumentUrl('https://cdn.example.com/notes.txt')).toBe(true)
    expect(isDocumentUrl('https://cdn.example.com/photo.jpg')).toBe(false)
  })
})

describe('detectPortfolioType', () => {
  it('uses mime type when provided', () => {
    expect(detectPortfolioType('https://cdn.example.com/x', 'video/mp4', 'x.bin')).toBe('Video')
    expect(detectPortfolioType('https://cdn.example.com/x', 'audio/mpeg', 'x.bin')).toBe('Audio')
    expect(detectPortfolioType('https://cdn.example.com/x', 'application/pdf', 'x.bin')).toBe('Document')
    expect(detectPortfolioType('https://cdn.example.com/x', 'image/png', 'x.bin')).toBe('Image')
  })

  it('falls back to extension and host heuristics', () => {
    expect(detectPortfolioType('https://cdn.example.com/clip.webm')).toBe('Video')
    expect(detectPortfolioType('https://www.youtube.com/watch?v=abc123')).toBe('Video')
    expect(detectPortfolioType('https://cdn.example.com/song.mp3')).toBe('Audio')
    expect(detectPortfolioType('https://cdn.example.com/file.pdf')).toBe('Document')
    expect(detectPortfolioType('https://cdn.example.com/photo.jpg')).toBe('Image')
    expect(detectPortfolioType('https://example.com/project')).toBe('Link')
  })
})

describe('detectGalleryMediaKind', () => {
  it('lets clear video URLs win over Image type', () => {
    expect(detectGalleryMediaKind('https://cdn.example.com/clip.mp4', { type: 'Image' })).toBe('video')
  })

  it('uses non-image portfolio type when URL is ambiguous', () => {
    expect(detectGalleryMediaKind('https://cdn.example.com/asset', { type: 'Audio' })).toBe('audio')
  })

  it('infers from featured URL', () => {
    expect(detectGalleryMediaKind('https://cdn.example.com/clip.mp4')).toBe('video')
    expect(detectGalleryMediaKind('https://cdn.example.com/song.wav')).toBe('audio')
  })
})

describe('isImageUrl', () => {
  it('recognizes image files, format hints and image-only CDNs', () => {
    expect(isImageUrl('https://cdn.example/a.JPG')).toBe(true)
    expect(isImageUrl('https://cdn.example/a.webp?v=2')).toBe(true)
    expect(isImageUrl('https://cdn.example/render?id=1&fm=png')).toBe(true)
    expect(
      isImageUrl('https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&q=80&w=300&h=200')
    ).toBe(true)
  })

  it('never classifies videos or unknown URLs as images', () => {
    expect(isImageUrl('https://cdn.example/intro.mp4')).toBe(false)
    expect(isImageUrl('https://app.vbizme.com/storage/ecard/backgroundVideos/59/Untitled design-30.mp4')).toBe(false)
    expect(isImageUrl('https://youtu.be/abc')).toBe(false)
    expect(isImageUrl('https://cdn.example/file')).toBe(false)
    expect(isImageUrl('')).toBe(false)
  })
})
