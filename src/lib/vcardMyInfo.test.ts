import { describe, expect, it } from 'vitest'

import { parseMyInfoJson } from '@/lib/vcardMyInfo'

describe('parseMyInfoJson', () => {
  it('decodes public My Info headings and action labels', () => {
    const result = parseMyInfoJson(
      JSON.stringify({
        headline: "Let's Talk&#x20;&amp;&#x20;Connect",
        callLabel: 'Call &amp; Talk',
        textLabel: 'Text&#x20;Me',
        emailLabel: 'Email &amp;amp; Connect',
      })
    )

    expect(result.headline).toBe("Let's Talk & Connect")
    expect(result.callLabel).toBe('Call & Talk')
    expect(result.textLabel).toBe('Text Me')
    expect(result.emailLabel).toBe('Email & Connect')
  })
})
