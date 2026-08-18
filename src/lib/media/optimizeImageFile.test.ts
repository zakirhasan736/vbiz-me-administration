import {
  isImageFile,
  isOptimizableImageFile,
  MAX_IMAGE_EDGE,
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

  it('treats common photo types as images and skips gif/svg/tiny files', () => {
    expect(isImageFile(file('photo.jpg', 'image/jpeg', 100))).toBe(true)
    expect(isOptimizableImageFile(file('photo.jpg', 'image/jpeg', 500 * 1024))).toBe(true)
    expect(isOptimizableImageFile(file('tiny.jpg', 'image/jpeg', 20 * 1024))).toBe(false)
    expect(isOptimizableImageFile(file('anim.gif', 'image/gif', 800 * 1024))).toBe(false)
    expect(isOptimizableImageFile(file('icon.svg', 'image/svg+xml', 800 * 1024))).toBe(false)
  })
})
