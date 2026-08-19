import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'
import { mergeParsedPersonal, parseOwnerPersonalFromText, patchDraftFromFieldKey } from './ownerPersonalParse'

describe('parseOwnerPersonalFromText', () => {
  it('reads labeled name, card name, email, phone, and DOB', () => {
    const parsed = parseOwnerPersonalFromText(
      'Full name: Jane Owner\nCard name: Reifexa\nEmail: jane@reifexa.com\nPhone: +1 860 555 0100\nDOB: 1990-05-05'
    )
    expect(parsed.fullName).toBe('Jane Owner')
    expect(parsed.company).toBe('Reifexa')
    expect(parsed.email).toBe('jane@reifexa.com')
    expect(parsed.phone).toContain('860')
    expect(parsed.dob).toBe('1990-05-05')
  })

  it('treats a short line as the public name', () => {
    expect(parseOwnerPersonalFromText('Jane Owner').fullName).toBe('Jane Owner')
  })
})

describe('patchDraftFromFieldKey', () => {
  it('writes field-phase answers into personal so the launch checklist can see them', () => {
    let draft = createDefaultVCardData()
    draft = patchDraftFromFieldKey(draft, 'fullName', 'Jane Owner')
    draft = patchDraftFromFieldKey(draft, 'email', 'jane@reifexa.com')
    draft = patchDraftFromFieldKey(draft, 'phone', '8605550100')
    draft = patchDraftFromFieldKey(draft, 'dob', '1990-05-05')
    draft = patchDraftFromFieldKey(draft, 'company', 'Reifexa')
    expect(draft.personal.fullName).toBe('Jane Owner')
    expect(draft.personal.email).toBe('jane@reifexa.com')
    expect(draft.personal.phone).toBe('8605550100')
    expect(draft.personal.dob).toBe('1990-05-05')
    expect(draft.personal.company).toBe('Reifexa')
    expect(draft.myInfo?.email).toBe('jane@reifexa.com')
  })

  it('uses card name as the public name when full name is still empty', () => {
    const draft = patchDraftFromFieldKey(createDefaultVCardData(), 'company', 'Reifexa')
    expect(draft.personal.company).toBe('Reifexa')
    expect(draft.personal.fullName).toBe('Reifexa')
  })
})

describe('mergeParsedPersonal', () => {
  it('keeps previously saved fields while adding newly parsed ones', () => {
    const base = patchDraftFromFieldKey(createDefaultVCardData(), 'email', 'keep@me.test')
    const merged = mergeParsedPersonal(base, parseOwnerPersonalFromText('Name is Pat Lee'))
    expect(merged.personal.email).toBe('keep@me.test')
    expect(merged.personal.fullName).toBe('Pat Lee')
  })
})
