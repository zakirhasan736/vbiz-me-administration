import { describe, expect, it } from 'vitest'
import {
  applyBrokenMediaFallback,
  BROKEN_IMAGE_PLACEHOLDER,
  BROKEN_MEDIA_ATTR,
  findAlreadyBrokenImages,
  isGuardableMedia,
} from './brokenMedia'
import { builderSectionFromPath } from './uploadMediaWithProgress'

const S3 = 'https://aws-s3-vbizme-vcard.s3.us-east-2.amazonaws.com/vbizme/1793285518140-ML1.jpg'

describe('public broken-media fallback', () => {
  it('swaps a failed image for the placeholder once', () => {
    const img = document.createElement('img')
    img.src = S3
    img.setAttribute('srcset', `${S3} 1x`)
    expect(isGuardableMedia(img)).toBe(true)
    applyBrokenMediaFallback(img)
    expect(img.src).toBe(BROKEN_IMAGE_PLACEHOLDER)
    expect(img.getAttribute('srcset')).toBeNull()
    expect(img.getAttribute(BROKEN_MEDIA_ATTR)).toBe('1')
    // Placeholder itself failing must not loop.
    expect(isGuardableMedia(img)).toBe(false)
  })

  it('hides a failed video without a poster, keeps one with a poster', () => {
    const bare = document.createElement('video')
    bare.src = S3
    applyBrokenMediaFallback(bare)
    expect(bare.style.display).toBe('none')

    const withPoster = document.createElement('video')
    withPoster.poster = 'https://example.com/poster.jpg'
    const source = document.createElement('source')
    source.src = S3
    withPoster.appendChild(source)
    applyBrokenMediaFallback(source)
    expect(withPoster.style.display).toBe('')
    expect(withPoster.getAttribute(BROKEN_MEDIA_ATTR)).toBe('1')
  })

  it('ignores non-media elements', () => {
    expect(isGuardableMedia(document.createElement('div'))).toBe(false)
    expect(isGuardableMedia(null)).toBe(false)
  })

  it('finds images that failed before hydration', () => {
    const root = document.createElement('div')
    const img = document.createElement('img')
    img.src = S3
    Object.defineProperty(img, 'complete', { value: true })
    Object.defineProperty(img, 'naturalWidth', { value: 0 })
    root.appendChild(img)
    expect(findAlreadyBrokenImages(root)).toEqual([img])
  })
})

describe('upload tab from builder URL', () => {
  it('reads the editor section', () => {
    expect(builderSectionFromPath('/vcards/edit/services')).toBe('services')
    expect(builderSectionFromPath('/vcards/create/portfolio/abc')).toBe('portfolio')
    expect(builderSectionFromPath('/vcards/edit/home/abc')).toBeUndefined()
    expect(builderSectionFromPath('/vCard/michelle-loyola')).toBeUndefined()
  })
})
