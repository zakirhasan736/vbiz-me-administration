import {
  DEFAULT_PROFILE_MEDIA_FRAME,
  parseProfileMediaFrame,
  PROFILE_FRAME_ZOOM_MIN,
  profileFramePhoneAspect,
  profileMediaCoverLayoutStyle,
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

  it('allows zooming out below 100%', () => {
    expect(PROFILE_FRAME_ZOOM_MIN).toBe(0.5)
    const frame = parseProfileMediaFrame({ zoom: 0.5 })
    expect(frame.zoom).toBe(0.5)
    expect(profileMediaFitStyle(frame).objectFit).toBe('contain')
    expect(profileMediaFitStyle(frame).transform).toBe('scale(0.5)')
  })

  it('pans left/right and top/bottom with cover layout math', () => {
    const frame = parseProfileMediaFrame({ focusX: 0, focusY: 100, zoom: 1 })
    // Portrait media in a landscape frame — cover binds on width.
    const style = profileMediaCoverLayoutStyle(frame, { width: 100, height: 200 }, { width: 320, height: 180 })
    expect(style.width).toBe(320)
    expect(style.height).toBe(640)
    expect(style.left).toBe(160)
    expect(style.top).toBe(-550)
  })

  it('zooms out below cover so more of the image is visible', () => {
    const frame = parseProfileMediaFrame({ focusX: 50, focusY: 50, zoom: 0.5 })
    const style = profileMediaCoverLayoutStyle(frame, { width: 100, height: 200 }, { width: 320, height: 180 })
    expect(style.width).toBe(160)
    expect(style.height).toBe(320)
    expect(style.left).toBe(80)
    expect(style.top).toBe(-70)
  })
})
