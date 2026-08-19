import {
  collectVCardActivationProblems,
  collectVCardCreationProblems,
  minCardAgeCutoffDate,
  vCardActivationProblemMessage,
  vCardCreationProblemMessage,
} from '@/lib/cardActivation'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

function completeCard(dob: string) {
  const defaults = createDefaultVCardData()
  return createDefaultVCardData({
    slug: 'jane-doe',
    personal: {
      ...defaults.personal,
      fullName: 'Jane Doe',
      email: 'jane@example.com',
      dob,
      phone: '+1 202 555 0101',
    },
  })
}

function shiftLocalDate(years: number, extraDays = 0): string {
  const now = new Date()
  const shifted = new Date(now.getFullYear() + years, now.getMonth(), now.getDate() + extraDays)
  const mm = String(shifted.getMonth() + 1).padStart(2, '0')
  const dd = String(shifted.getDate()).padStart(2, '0')
  return `${shifted.getFullYear()}-${mm}-${dd}`
}

describe('card activation readiness', () => {
  it('requires the starred personal fields before activation', () => {
    const problems = collectVCardActivationProblems(createDefaultVCardData())
    expect(problems.map((problem) => problem.field)).toEqual(['slug', 'name', 'email', 'dob'])
    expect(vCardActivationProblemMessage(problems)).toContain('Date of birth')
  })

  it('asks to enter date of birth when that is the only missing field', () => {
    const data = completeCard('')
    const problems = collectVCardActivationProblems(data)
    expect(problems).toEqual([{ field: 'dob', label: 'Date of birth', reason: 'missing' }])
    expect(vCardActivationProblemMessage(problems)).toBe('Card cannot be activated. Please enter your date of birth.')
  })

  it('accepts a complete valid card', () => {
    expect(collectVCardActivationProblems(completeCard('1990-07-18'))).toEqual([])
  })

  it('accepts a complete card without a phone number', () => {
    const defaults = createDefaultVCardData()
    const data = createDefaultVCardData({
      slug: 'jane-doe',
      personal: {
        ...defaults.personal,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        dob: '1990-07-18',
        phone: '',
      },
    })
    expect(collectVCardActivationProblems(data)).toEqual([])
  })

  it('rejects an invalid phone number when one is provided', () => {
    const defaults = createDefaultVCardData()
    const data = createDefaultVCardData({
      slug: 'jane-doe',
      personal: {
        ...defaults.personal,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        dob: '1990-07-18',
        phone: '123',
      },
    })
    expect(collectVCardActivationProblems(data)).toEqual([{ field: 'phone', label: 'Phone', reason: 'invalid' }])
  })

  it('accepts a date of birth of exactly 12 years ago', () => {
    expect(collectVCardActivationProblems(completeCard(minCardAgeCutoffDate()))).toEqual([])
  })

  it('rejects a date of birth younger than 12 years', () => {
    const dob = shiftLocalDate(-12, 1)
    const problems = collectVCardActivationProblems(completeCard(dob))
    expect(problems).toEqual([{ field: 'dob', label: 'Date of birth', reason: 'underage' }])
    expect(vCardActivationProblemMessage(problems)).toBe('Card cannot be activated. You must be at least 12 years old.')
  })

  it('asks for a valid date of birth when the value is not a real date', () => {
    const problems = collectVCardActivationProblems(completeCard('2024-02-31'))
    expect(problems).toEqual([{ field: 'dob', label: 'Date of birth', reason: 'invalid' }])
    expect(vCardActivationProblemMessage(problems)).toBe(
      'Card cannot be activated. Please enter a valid date of birth.'
    )
  })

  it('does not require phone but still reports an underage date of birth', () => {
    const defaults = createDefaultVCardData()
    const data = createDefaultVCardData({
      slug: 'jane-doe',
      personal: {
        ...defaults.personal,
        fullName: 'Jane Doe',
        email: 'jane@example.com',
        dob: shiftLocalDate(-12, 1),
        phone: '',
      },
    })
    const problems = collectVCardActivationProblems(data)
    expect(vCardActivationProblemMessage(problems)).toBe('Card cannot be activated. You must be at least 12 years old.')
  })

  it('requires email, phone, and a valid date of birth for draft creation', () => {
    const missing = collectVCardCreationProblems(completeCard(''))
    expect(missing).toEqual([{ field: 'dob', label: 'Date of birth', reason: 'missing' }])
    expect(vCardCreationProblemMessage(missing[0])).toBe('Please enter a date of birth before creating the vCard.')
    expect(collectVCardCreationProblems(completeCard('1990-07-18'))).toEqual([])

    const defaults = createDefaultVCardData()
    const noEmail = createDefaultVCardData({
      personal: { ...defaults.personal, email: '', phone: '+1 202 555 0101', dob: '1990-07-18' },
    })
    expect(collectVCardCreationProblems(noEmail).map((problem) => problem.field)).toEqual(['email'])
  })
})
