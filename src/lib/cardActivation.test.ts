import { collectVCardActivationProblems, vCardActivationProblemMessage } from '@/lib/cardActivation'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

describe('card activation readiness', () => {
  it('requires the five starred personal fields before activation', () => {
    const problems = collectVCardActivationProblems(createDefaultVCardData())
    expect(problems.map((problem) => problem.field)).toEqual(['slug', 'name', 'email', 'dob', 'phone'])
    expect(vCardActivationProblemMessage(problems)).toContain('Date of birth')
  })

  it('accepts a complete valid card', () => {
    const defaults = createDefaultVCardData()
    const data = createDefaultVCardData({
      slug: 'jane-doe',
      personal: {
        ...defaults.personal,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        dob: '1990-07-18',
        phone: '+1 202 555 0101',
      },
    })
    expect(collectVCardActivationProblems(data)).toEqual([])
  })
})
