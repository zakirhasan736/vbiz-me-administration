import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { describe, expect, it } from 'vitest'
import { audioFromDisplaySettings } from './audioFromDisplaySettings'

function settingsWith(fields: VCardDisplaySettings['fields']): VCardDisplaySettings {
  return { globalEnabled: true, fields }
}

describe('audioFromDisplaySettings', () => {
  it('prefers uploaded audio file over YouTube', () => {
    const audio = audioFromDisplaySettings(
      settingsWith({
        'Background Music': { visible: true, customValue: 'https://cdn.example.com/track.mp3' },
        'YouTube Background Music Link': {
          visible: true,
          customValue: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        },
      })
    )
    expect(audio).toMatchObject({
      enabled: true,
      use_youtube_link: false,
      url: 'https://cdn.example.com/track.mp3',
    })
  })

  it('uses YouTube link when no file is set', () => {
    const audio = audioFromDisplaySettings(
      settingsWith({
        'YouTube Background Music Link': {
          visible: true,
          customValue: 'https://youtu.be/dQw4w9WgXcQ',
        },
      })
    )
    expect(audio?.use_youtube_link).toBe(true)
    expect(audio?.youtube?.video_id).toBe('dQw4w9WgXcQ')
  })

  it('treats a YouTube URL stored in the file field as YouTube', () => {
    const audio = audioFromDisplaySettings(
      settingsWith({
        'Background Music': {
          visible: true,
          customValue: 'https://www.youtube.com/watch?v=abc123XYZ_',
        },
      })
    )
    expect(audio?.use_youtube_link).toBe(true)
    expect(audio?.youtube?.video_id).toBe('abc123XYZ_')
  })
})
