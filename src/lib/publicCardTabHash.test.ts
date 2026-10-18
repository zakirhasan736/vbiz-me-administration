import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  encodePublicCardTabHash,
  parsePublicCardTabHash,
  resolveTabIdFromHash,
  withPublicCardTabHash,
} from './publicCardTabHash'

describe('publicCardTabHash', () => {
  it('encodes and parses tab hashes', () => {
    assert.equal(encodePublicCardTabHash('services'), '#services')
    assert.equal(parsePublicCardTabHash('#Services'), 'services')
    assert.equal(withPublicCardTabHash('/vCard/wd', 'services'), '/vCard/wd#services')
  })

  it('resolves hash against visible tabs by id or label', () => {
    const tabs = [
      { id: 'services', label: 'Services' },
      { id: 'gallery', label: 'Gallery', displayLabel: 'Photos' },
    ]
    assert.equal(resolveTabIdFromHash('services', tabs), 'services')
    assert.equal(resolveTabIdFromHash('photos', tabs), 'gallery')
    assert.equal(resolveTabIdFromHash('missing', tabs), null)
  })
})
