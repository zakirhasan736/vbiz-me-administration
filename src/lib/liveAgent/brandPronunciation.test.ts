import { describe, expect, it } from 'vitest'
import { buildGreetingText, possessiveName, VBIZ_ME_SPOKEN_BRAND } from './brandPronunciation'

describe('live agent card-owner greeting', () => {
  it('builds possessive host greetings', () => {
    expect(possessiveName('Michaelangelo')).toBe("Michaelangelo's")
    expect(possessiveName('James')).toBe("James'")
    expect(buildGreetingText('Michaelangelo')).toBe(
      `Welcome to Michaelangelo's ${VBIZ_ME_SPOKEN_BRAND} Card! How can I help you? I can offer a quick guided tour of the card if you'd like.`
    )
  })
})
