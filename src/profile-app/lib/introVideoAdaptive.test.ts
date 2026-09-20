import { describe, expect, it } from 'vitest'
import {
  applyCloudinaryVideoQuality,
  buildAdaptiveIntroUrl,
  canAdaptIntroUrl,
  lowerIntroQuality,
  pickIntroQuality,
} from './introVideoAdaptive'

describe('pickIntroQuality', () => {
  it('drops to 360p on save-data or 2g', () => {
    expect(pickIntroQuality({ saveData: true })).toBe(360)
    expect(pickIntroQuality({ effectiveType: '2g' })).toBe(360)
    expect(pickIntroQuality({ effectiveType: 'slow-2g' })).toBe(360)
  })

  it('uses downlink like YouTube ABR', () => {
    expect(pickIntroQuality({ downlink: 0.8 })).toBe(360)
    expect(pickIntroQuality({ downlink: 2.5 })).toBe(540)
    expect(pickIntroQuality({ downlink: 8 })).toBe(720)
  })

  it('defaults to 540p on phones when Safari has no connection API', () => {
    expect(pickIntroQuality({}, { isMobile: true })).toBe(540)
    expect(pickIntroQuality({}, { isMobile: false })).toBe(720)
  })
})

describe('lowerIntroQuality', () => {
  it('steps down the ladder then stops', () => {
    expect(lowerIntroQuality(720)).toBe(540)
    expect(lowerIntroQuality(540)).toBe(360)
    expect(lowerIntroQuality(360)).toBeNull()
  })
})

describe('buildAdaptiveIntroUrl', () => {
  it('leaves same-origin and blob URLs alone', () => {
    expect(buildAdaptiveIntroUrl('/e2e/intro.mp4', 360)).toBe('/e2e/intro.mp4')
    expect(buildAdaptiveIntroUrl('blob:https://vbiz.me/abc', 540)).toBe('blob:https://vbiz.me/abc')
  })

  it('injects Cloudinary H.264 width/bitrate transforms', () => {
    const src = 'https://res.cloudinary.com/demo/video/upload/v1/about_clip.mp4'
    expect(applyCloudinaryVideoQuality(src, 360)).toBe(
      'https://res.cloudinary.com/demo/video/upload/f_mp4,vc_h264,q_auto:eco,w_360,c_limit,br_400k/v1/about_clip.mp4'
    )
    expect(buildAdaptiveIntroUrl(src, 720)).toContain('w_720')
  })

  it('replaces existing Cloudinary transforms instead of stacking them', () => {
    const src = 'https://res.cloudinary.com/demo/video/upload/q_auto,w_1280/v12/folder/clip.mp4'
    expect(applyCloudinaryVideoQuality(src, 540)).toBe(
      'https://res.cloudinary.com/demo/video/upload/f_mp4,vc_h264,q_auto:good,w_540,c_limit,br_700k/v12/folder/clip.mp4'
    )
  })

  it('adds ImageKit width transforms', () => {
    const src = 'https://ik.imagekit.io/demo/intro.mp4'
    expect(buildAdaptiveIntroUrl(src, 360)).toBe('https://ik.imagekit.io/demo/intro.mp4?tr=w-360%2Cq-60%2Cf-mp4')
    expect(canAdaptIntroUrl(src)).toBe(true)
  })

  it('keeps generic S3 URLs unchanged when no transform CDN is present', () => {
    const src = 'https://cdn.example.com/uploads/intro.mp4'
    expect(buildAdaptiveIntroUrl(src, 360)).toBe(src)
    expect(canAdaptIntroUrl(src)).toBe(false)
  })
})
