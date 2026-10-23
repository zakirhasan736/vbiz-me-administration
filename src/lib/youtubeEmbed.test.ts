import { describe, expect, it } from 'vitest'
import { buildYoutubePlayerEmbedUrl, extractYoutubeVideoId, isYoutubeUrl } from './youtubeEmbed'

describe('youtubeEmbed', () => {
  it('extracts ids from common YouTube URL shapes', () => {
    expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(extractYoutubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ')
    expect(isYoutubeUrl('https://example.com/video.mp4')).toBe(false)
  })

  it('builds an inline player embed url', () => {
    const src = buildYoutubePlayerEmbedUrl('https://youtu.be/dQw4w9WgXcQ', {
      autoplay: false,
      muted: true,
      controls: true,
    })
    expect(src).toContain('youtube.com/embed/dQw4w9WgXcQ')
    expect(src).toContain('autoplay=0')
    expect(src).toContain('mute=1')
    expect(src).toContain('playsinline=1')
  })
})
