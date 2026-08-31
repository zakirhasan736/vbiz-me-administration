import { describe, expect, it } from 'vitest'
import {
  MAX_VIDEO_OPTIMIZE_DURATION_SEC,
  SKIP_VIDEO_OPTIMIZE_BYTES,
  pickVideoOptimizePlaybackRate,
  shouldSkipVideoOptimize,
} from './optimizeVideoFile'

describe('pickVideoOptimizePlaybackRate', () => {
  it('uses faster rates for longer clips', () => {
    expect(pickVideoOptimizePlaybackRate(20)).toBe(4)
    expect(pickVideoOptimizePlaybackRate(90)).toBe(12)
    expect(pickVideoOptimizePlaybackRate(120)).toBe(12)
    expect(pickVideoOptimizePlaybackRate(300)).toBe(16)
  })
})

describe('shouldSkipVideoOptimize', () => {
  it('skips tiny, huge, or very long sources', () => {
    const tiny = new File([new Uint8Array(512 * 1024)], 'tiny.mp4', { type: 'video/mp4' })
    const large = new File([new Uint8Array(SKIP_VIDEO_OPTIMIZE_BYTES + 1)], 'big.mp4', { type: 'video/mp4' })

    expect(shouldSkipVideoOptimize(tiny)).toBe(true)
    expect(shouldSkipVideoOptimize(large)).toBe(true)
    expect(shouldSkipVideoOptimize(large, MAX_VIDEO_OPTIMIZE_DURATION_SEC + 1)).toBe(true)
  })

  it('optimizes typical explainer-sized uploads', () => {
    const file = new File([new Uint8Array(5 * 1024 * 1024)], 'explainer.mp4', { type: 'video/mp4' })
    expect(shouldSkipVideoOptimize(file, 90)).toBe(false)
  })
})
