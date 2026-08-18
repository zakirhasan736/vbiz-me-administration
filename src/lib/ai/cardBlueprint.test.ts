import { cardBlueprintSchema, mapBlueprintToVCardData } from '@/lib/ai/cardBlueprint'
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
})
