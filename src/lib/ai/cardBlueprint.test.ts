import { applyAnalyzeToDraft, preferExistingPersonal } from '@/lib/ai/applyCardDraft'
import { cardBlueprintSchema, mapBlueprintToVCardData } from '@/lib/ai/cardBlueprint'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

describe('AI card blueprint personal information', () => {
  it('maps a sourced date of birth into the editor draft', () => {
    const blueprint = cardBlueprintSchema.parse({
      businessSummary: 'Profile',
      suggestedSlug: 'profile-owner',
      personal: {
        fullName: 'Profile Owner',
        dob: '1990-07-18',
      },
    })

    expect(mapBlueprintToVCardData(blueprint).data.personal.dob).toBe('1990-07-18')
  })

  it('keeps date of birth empty when the sources do not provide one', () => {
    const blueprint = cardBlueprintSchema.parse({
      businessSummary: 'Profile',
      suggestedSlug: 'profile-owner',
      personal: { fullName: 'Profile Owner' },
    })

    expect(mapBlueprintToVCardData(blueprint).data.personal.dob).toBe('')
  })

  it('does not let a later job snapshot wipe owner-entered personal fields', () => {
    const base = createDefaultVCardData({
      personal: {
        ...createDefaultVCardData().personal,
        fullName: 'Jane Owner',
        email: 'jane@reifexa.com',
        phone: '8605550100',
        dob: '1990-05-05',
      },
    })
    const blueprint = cardBlueprintSchema.parse({
      businessSummary: 'Profile',
      suggestedSlug: 'reifexa',
      personal: { fullName: '', email: '', phone: '', company: 'Reifexa' },
    })
    const mapped = applyAnalyzeToDraft({ blueprint }, base)
    expect(mapped.data.personal.fullName).toBe('Jane Owner')
    expect(mapped.data.personal.email).toBe('jane@reifexa.com')
    expect(mapped.data.personal.phone).toBe('8605550100')
    expect(mapped.data.personal.dob).toBe('1990-05-05')
    expect(preferExistingPersonal(base, mapped.data).personal.company).toBe('Reifexa')
  })
})
