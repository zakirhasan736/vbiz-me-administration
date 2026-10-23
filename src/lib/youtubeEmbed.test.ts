import { describe, expect, it } from 'vitest'
import {
  buildYoutubeAudioOnlyEmbedUrl,
  buildYoutubePlayerEmbedUrl,
  extractYoutubeVideoId,
  isYoutubeUrl,
} from './youtubeEmbed'

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
    expect(src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(src).toContain('autoplay=0')
    expect(src).toContain('mute=1')
    expect(src).toContain('playsinline=1')
  })

  it('hides chrome for fullscreen intro embeds', () => {
    const src = buildYoutubePlayerEmbedUrl('https://youtu.be/dQw4w9WgXcQ', {
      hideChrome: true,
      controls: false,
    })
    expect(src).toContain('controls=0')
    expect(src).toContain('modestbranding=1')
    expect(src).toContain('iv_load_policy=3')
    expect(src).toContain('fs=0')
    expect(src).toContain('disablekb=1')
  })

  it('builds an audio-only background music embed', () => {
    const src = buildYoutubeAudioOnlyEmbedUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ', {
      muted: true,
      loop: true,
    })
    expect(src).toContain('youtube-nocookie.com/embed/dQw4w9WgXcQ')
    expect(src).toContain('controls=0')
    expect(src).toContain('loop=1')
    expect(src).toContain('playlist=dQw4w9WgXcQ')
  })
})
