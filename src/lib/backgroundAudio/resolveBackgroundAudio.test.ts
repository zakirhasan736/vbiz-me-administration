import { describe, expect, it } from 'vitest'
import { resolveBackgroundAudioSource } from './resolveBackgroundAudio'

describe('resolveBackgroundAudioSource', () => {
  it('resolves uploaded file for muted autoplay path', () => {
    const source = resolveBackgroundAudioSource({
      enabled: true,
      url: 'https://cdn.example.com/bg.mp3',
      use_youtube_link: false,
      repeat: true,
    })
    expect(source).toEqual({
      type: 'file',
      src: 'https://cdn.example.com/bg.mp3',
      startTime: 0,
      endTime: null,
      loop: true,
    })
  })

  it('resolves YouTube when use_youtube_link is set', () => {
    const source = resolveBackgroundAudioSource({
      enabled: true,
      use_youtube_link: true,
      youtube: { link: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
    })
    expect(source?.type).toBe('youtube')
    if (source?.type === 'youtube') {
      expect(source.videoId).toBe('dQw4w9WgXcQ')
    }
  })

  it('resolves YouTube from url when flag is missing', () => {
    const source = resolveBackgroundAudioSource({
      enabled: true,
      url: 'https://youtu.be/dQw4w9WgXcQ',
      use_youtube_link: false,
    })
    expect(source?.type).toBe('youtube')
    if (source?.type === 'youtube') {
      expect(source.videoId).toBe('dQw4w9WgXcQ')
    }
  })
})
