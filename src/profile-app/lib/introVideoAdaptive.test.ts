import { describe, expect, it } from 'vitest'
import {
  applyCloudinaryVideoQuality,
  buildAdaptiveBackgroundVideoUrl,
  buildAdaptiveIntroUrl,
  buildBackgroundVideoPosterUrl,
  canAdaptIntroUrl,
  lowerIntroQuality,
  pickBackgroundQuality,
  pickIntroQuality,
  resolveAdaptiveBackgroundVideoSrc,
  withVideoStartHint,
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

  it('defaults lower on Safari when there is no connection API', () => {
    expect(pickIntroQuality({}, { isMobile: true, isSafari: true })).toBe(360)
    expect(pickIntroQuality({}, { isMobile: false, isSafari: true })).toBe(540)
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

describe('pickBackgroundQuality', () => {
  it('never goes above 540 and prefers 360 on weak links', () => {
    expect(pickBackgroundQuality({ saveData: true })).toBe(360)
    expect(pickBackgroundQuality({ effectiveType: '3g' })).toBe(360)
    expect(pickBackgroundQuality({ downlink: 2 })).toBe(360)
    expect(pickBackgroundQuality({ downlink: 8 })).toBe(540)
    expect(pickBackgroundQuality({}, { isMobile: true, isSafari: true })).toBe(360)
    expect(pickBackgroundQuality({}, { isMobile: false })).toBe(540)
  })

  it('keeps iPhone/Safari at 360 even on strong downlink hints', () => {
    expect(pickBackgroundQuality({ downlink: 20 }, { isMobile: true, isSafari: true })).toBe(360)
    expect(pickBackgroundQuality({ downlink: 20 }, { isMobile: true })).toBe(360)
  })

  it('resolves a lean Safari background URL with poster + start hint', () => {
    const src = 'https://res.cloudinary.com/demo/video/upload/v1/bg.mp4'
    const out = resolveAdaptiveBackgroundVideoSrc(src, {
      isMobile: true,
      isSafari: true,
      hints: { downlink: 20 },
    })
    expect(out).toContain('w_360')
    expect(out).toContain('ac_none')
    expect(out).toContain('br_180k')
    expect(out).toContain('fps_20')
    expect(out).toContain('#t=0.001')
    expect(buildBackgroundVideoPosterUrl(src)).toContain('so_0,f_jpg,w_360')
    expect(buildAdaptiveBackgroundVideoUrl(src, 360, { lean: true })).toContain('q_auto:low')
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
      'https://res.cloudinary.com/demo/video/upload/f_mp4,vc_h264,q_auto:eco,w_360,c_limit,br_280k/v1/about_clip.mp4'
    )
    expect(buildAdaptiveIntroUrl(src, 720)).toContain('w_720')
  })

  it('strips audio for muted background videos', () => {
    const src = 'https://res.cloudinary.com/demo/video/upload/v1/bg.mp4'
    expect(buildAdaptiveBackgroundVideoUrl(src, 360)).toContain('ac_none')
    expect(buildAdaptiveIntroUrl(src, 360)).not.toContain('ac_none')
  })

  it('replaces existing Cloudinary transforms instead of stacking them', () => {
    const src = 'https://res.cloudinary.com/demo/video/upload/q_auto,w_1280/v12/folder/clip.mp4'
    expect(applyCloudinaryVideoQuality(src, 540)).toBe(
      'https://res.cloudinary.com/demo/video/upload/f_mp4,vc_h264,q_auto:eco,w_540,c_limit,br_550k/v12/folder/clip.mp4'
    )
  })

  it('adds ImageKit width transforms', () => {
    const src = 'https://ik.imagekit.io/demo/intro.mp4'
    expect(buildAdaptiveIntroUrl(src, 360)).toBe('https://ik.imagekit.io/demo/intro.mp4?tr=w-360%2Cq-40%2Cf-mp4')
    expect(canAdaptIntroUrl(src)).toBe(true)
  })

  it('keeps generic S3 URLs unchanged when no transform CDN is present', () => {
    const src = 'https://cdn.example.com/uploads/intro.mp4'
    expect(buildAdaptiveIntroUrl(src, 360)).toBe(src)
    expect(canAdaptIntroUrl(src)).toBe(false)
  })

  it('adds a Safari first-frame media hint', () => {
    expect(withVideoStartHint('https://cdn.example.com/a.mp4')).toBe('https://cdn.example.com/a.mp4#t=0.001')
    expect(withVideoStartHint('https://cdn.example.com/a.mp4#t=1')).toBe('https://cdn.example.com/a.mp4#t=1')
  })
})
