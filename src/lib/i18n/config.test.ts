import { describe, expect, it } from 'vitest'

import {
  languageDisplayName,
  languageEmojiFlag,
  languageFlagCodeForLang,
  languageFlagImageUrl,
  languageFlagSvgUrl,
} from '@/lib/i18n/config'

describe('public card language display', () => {
  it('uses the American flag and American English for en', () => {
    expect(languageFlagCodeForLang('en')).toBe('US')
    expect(languageDisplayName('en')).toBe('American English')
    expect(languageEmojiFlag('en')).toBe('🇺🇸')
  })

  it('serves flagcdn sizes the CDN actually hosts', () => {
    expect(languageFlagImageUrl('US', 28)).toBe('https://flagcdn.com/w40/us.png')
    expect(languageFlagImageUrl('us', 40)).toBe('https://flagcdn.com/w40/us.png')
    expect(languageFlagSvgUrl('US')).toBe('https://flagcdn.com/us.svg')
  })
})
