import { describe, expect, it } from 'vitest'
import { shouldAutofillSlugFromName, slugFromDisplayName } from './vcardSlug'

describe('slugFromDisplayName', () => {
  it('slugifies a personal name', () => {
    expect(slugFromDisplayName('Ada Lovelace')).toBe('ada-lovelace')
  })

  it('returns empty when the name has no slug characters', () => {
    expect(slugFromDisplayName('!!!')).toBe('')
  })
})

describe('shouldAutofillSlugFromName', () => {
  it('is true only when the slug is empty', () => {
    expect(shouldAutofillSlugFromName('')).toBe(true)
    expect(shouldAutofillSlugFromName('  ')).toBe(true)
    expect(shouldAutofillSlugFromName(null)).toBe(true)
    expect(shouldAutofillSlugFromName('existing-card')).toBe(false)
  })
})
