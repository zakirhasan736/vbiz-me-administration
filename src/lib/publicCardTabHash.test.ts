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
    expect(withPublicCardTabHash('/vCard/wd', 'services')).toBe('/vCard/wd#services')
  })

  it('resolves hash against visible tabs by id or label', () => {
    const tabs = [
      { id: 'services', label: 'Services' },
      { id: 'gallery', label: 'Gallery', displayLabel: 'Photos' },
    ]
    expect(resolveTabIdFromHash('services', tabs)).toBe('services')
    expect(resolveTabIdFromHash('photos', tabs)).toBe('gallery')
    expect(resolveTabIdFromHash('missing', tabs)).toBeNull()
  })
})
