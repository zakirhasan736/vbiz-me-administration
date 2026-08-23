import { describe, expect, it } from 'vitest'
import {
  MIN_IDENTITY_SEARCH_CHARACTERS,
  isIdentitySearchReady,
  matchesIdentitySearch,
  normalizedSearchQuery,
} from './identitySearch'

describe('identity search', () => {
  it('requires at least three trimmed characters', () => {
    expect(MIN_IDENTITY_SEARCH_CHARACTERS).toBe(3)
    expect(isIdentitySearchReady('ab')).toBe(false)
    expect(isIdentitySearchReady('  abc  ')).toBe(true)
  })

  it('normalizes whitespace and casing', () => {
    expect(normalizedSearchQuery('  Sales   MANAGER ')).toBe('sales manager')
  })

  it('matches every token across separate identity fields', () => {
    const identity = ['Abby Fritz', 'Sales Director', 'Eventz Co.', 'abby@example.com']
    expect(matchesIdentitySearch('abby sales', identity)).toBe(true)
    expect(matchesIdentitySearch('abby engineer', identity)).toBe(false)
    expect(matchesIdentitySearch('ab', identity)).toBe(false)
  })
})
