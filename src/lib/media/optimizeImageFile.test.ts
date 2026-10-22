import {
  isImageFile,
  isOptimizableImageFile,
  MAX_COVER_IMAGE_EDGE,
  MAX_IMAGE_EDGE,
  MIN_COVER_SHORT_EDGE,
  scaledCoverImageDimensions,
  scaledImageDimensions,
} from '@/lib/media/optimizeImageFile'
import { describe, expect, it } from 'vitest'

const file = (name: string, type: string, bytes: number) => new File([new Uint8Array(bytes)], name, { type })

describe('optimizeImageFile helpers', () => {
  it('scales the long edge down to MAX_IMAGE_EDGE without upscaling', () => {
    expect(scaledImageDimensions(4000, 2000)).toEqual({
      width: MAX_IMAGE_EDGE,
      height: Math.round((2000 * MAX_IMAGE_EDGE) / 4000),
    })
    expect(scaledImageDimensions(800, 600)).toEqual({ width: 800, height: 600 })
  })

  it('keeps cover short edge high enough for mobile portrait crops', () => {
    // Landscape 16:9 — standard path would crush short edge; cover budget preserves it.
    const cover = scaledCoverImageDimensions(6000, 3375)
    expect(Math.max(cover.width, cover.height)).toBeLessThanOrEqual(MAX_COVER_IMAGE_EDGE)
    expect(Math.min(cover.width, cover.height)).toBeGreaterThanOrEqual(MIN_COVER_SHORT_EDGE)

    // Already small — do not upscale.
    expect(scaledCoverImageDimensions(1200, 800)).toEqual({ width: 1200, height: 800 })
  })

  it('treats common photo types as images and skips gif/svg/tiny files', () => {
    expect(isImageFile(file('photo.jpg', 'image/jpeg', 100))).toBe(true)
    expect(isOptimizableImageFile(file('photo.jpg', 'image/jpeg', 500 * 1024))).toBe(true)
    expect(isOptimizableImageFile(file('tiny.jpg', 'image/jpeg', 20 * 1024))).toBe(false)
    expect(isOptimizableImageFile(file('anim.gif', 'image/gif', 800 * 1024))).toBe(false)
    expect(isOptimizableImageFile(file('icon.svg', 'image/svg+xml', 800 * 1024))).toBe(false)
  })
})
