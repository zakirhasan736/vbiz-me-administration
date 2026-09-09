import { blobToRecordedFile, formatRecordingElapsed } from '@/lib/media/mediaRecorderMime'
import { describe, expect, it } from 'vitest'

describe('mediaRecorderMime', () => {
  it('formats elapsed recording time', () => {
    expect(formatRecordingElapsed(0)).toBe('0:00')
    expect(formatRecordingElapsed(9)).toBe('0:09')
    expect(formatRecordingElapsed(65)).toBe('1:05')
    expect(formatRecordingElapsed(125)).toBe('2:05')
  })

  it('builds an audio File from a blob', () => {
    const file = blobToRecordedFile(new Blob(['abc'], { type: 'audio/webm' }), 'audio')
    expect(file.name).toMatch(/^wish-audio-\d+\.webm$/)
    expect(file.type).toBe('audio/webm')
  })

  it('builds a video File from a blob', () => {
    const file = blobToRecordedFile(new Blob(['abc'], { type: 'video/mp4' }), 'video')
    expect(file.name).toMatch(/^wish-video-\d+\.mp4$/)
    expect(file.type).toBe('video/mp4')
  })
})
