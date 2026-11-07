import { afterEach, describe, expect, it } from 'vitest'
import {
  clearPublicCardBootstrapFallback,
  forgetPublicCardBootstrap,
  PUBLIC_CARD_FALLBACK_MAX_AGE_MS,
  PUBLIC_CARD_FALLBACK_MAX_ENTRIES,
  recallPublicCardBootstrap,
  rememberPublicCardBootstrap,
} from './publicCardBootstrapFallback'

afterEach(() => clearPublicCardBootstrapFallback())

describe('public card bootstrap fallback', () => {
  it('returns the last good payload for a slug, case-insensitively', () => {
    rememberPublicCardBootstrap('Alisa-St-Georges', { name: 'Alisa' }, 1_000)
    expect(recallPublicCardBootstrap('alisa-st-georges', 2_000)).toEqual({ name: 'Alisa' })
  })

  it('expires copies older than the max age', () => {
    rememberPublicCardBootstrap('card', { v: 1 }, 0)
    expect(recallPublicCardBootstrap('card', PUBLIC_CARD_FALLBACK_MAX_AGE_MS + 1)).toBeNull()
  })

  it('forgets a card that no longer exists', () => {
    rememberPublicCardBootstrap('gone', { v: 1 })
    forgetPublicCardBootstrap('gone')
    expect(recallPublicCardBootstrap('gone')).toBeNull()
  })

  it('evicts the oldest entries past the size cap', () => {
    for (let i = 0; i <= PUBLIC_CARD_FALLBACK_MAX_ENTRIES; i += 1) {
      rememberPublicCardBootstrap(`card-${i}`, { i }, 1_000)
    }
    expect(recallPublicCardBootstrap('card-0', 1_000)).toBeNull()
    expect(recallPublicCardBootstrap(`card-${PUBLIC_CARD_FALLBACK_MAX_ENTRIES}`, 1_000)).toEqual({
      i: PUBLIC_CARD_FALLBACK_MAX_ENTRIES,
    })
  })
})
