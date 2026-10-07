import {
  DEFAULT_PROFILE_MEDIA_FRAME,
  parseProfileMediaFrame,
  profileFramePhoneAspect,
  profileMediaFitStyle,
  profileMediaObjectPosition,
} from '@/lib/media/profileMediaFrame'
import { describe, expect, it } from 'vitest'

describe('profile media frame', () => {
  it('keeps the current top-center crop when nothing is stored', () => {
    const frame = parseProfileMediaFrame(undefined)
    expect(frame).toEqual(DEFAULT_PROFILE_MEDIA_FRAME)
    expect(profileMediaObjectPosition(frame)).toBe('50% 0%')
    expect(profileMediaFitStyle(frame).transform).toBe('none')
    expect(profileFramePhoneAspect(frame)).toBe('4 / 4.5')
  })

  it('clamps drag, zoom, and height', () => {
    const frame = parseProfileMediaFrame({ focusX: 140, focusY: -20, zoom: 9, height: 0.1 })
    expect(frame.focusX).toBe(100)
    expect(frame.focusY).toBe(0)
    expect(frame.zoom).toBe(2.5)
    expect(frame.height).toBe(0.7)
    expect(profileMediaFitStyle(frame).objectPosition).toBe('100% 0%')
    expect(profileMediaFitStyle(frame).transform).toBe('scale(2.5)')
    expect(profileMediaFitStyle(frame).transformOrigin).toBe('100% 0%')
  })
})
