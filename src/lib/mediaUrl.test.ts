import { describe, expect, it } from 'vitest'
import { isVideoUrl } from './mediaUrl'

describe('isVideoUrl', () => {
  it('treats uploaded files and Cloudinary video paths as video', () => {
    expect(isVideoUrl('https://cdn.example.com/about.mp4')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/about.m4v?v=1')).toBe(true)
    expect(isVideoUrl('https://res.cloudinary.com/demo/video/upload/v1/about_clip')).toBe(true)
    expect(isVideoUrl('https://cdn.example.com/about.jpg')).toBe(false)
  })
})
