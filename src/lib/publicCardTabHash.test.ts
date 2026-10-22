import { describe, expect, it } from 'vitest'
import {
  encodePublicCardTabHash,
  parsePublicCardTabHash,
  resolveTabIdFromHash,
  withPublicCardTabHash,
} from './publicCardTabHash'

describe('publicCardTabHash', () => {
  it('encodes and parses tab hashes', () => {
    expect(encodePublicCardTabHash('services')).toBe('#services')
    expect(parsePublicCardTabHash('#Services')).toBe('services')
    expect(parsePublicCardTabHash('#aboutme')).toBe('aboutme')
    expect(withPublicCardTabHash('/vCard/wd', 'services')).toBe('/vCard/wd#services')
  })

  it('resolves hash against visible tabs by id, label, compact form, or alias', () => {
    const tabs = [
      { id: 'about', label: 'About Me' },
      { id: 'services', label: 'Services' },
      { id: 'gallery', label: 'Gallery', displayLabel: 'Photos' },
      { id: 'mission', label: 'Company Mission Statement' },
      { id: 'events-2', label: 'Events' },
    ]
    expect(resolveTabIdFromHash('services', tabs)).toBe('services')
    expect(resolveTabIdFromHash('photos', tabs)).toBe('gallery')
    expect(resolveTabIdFromHash('about', tabs)).toBe('about')
    expect(resolveTabIdFromHash('aboutme', tabs)).toBe('about')
    expect(resolveTabIdFromHash('about-me', tabs)).toBe('about')
    expect(resolveTabIdFromHash('about_me', tabs)).toBe('about')
    expect(resolveTabIdFromHash('About Me', tabs)).toBe('about')
    expect(resolveTabIdFromHash('companymission', tabs)).toBe('mission')
    expect(resolveTabIdFromHash('events-2', tabs)).toBe('events-2')
    expect(resolveTabIdFromHash('missing', tabs)).toBeNull()
  })
})
