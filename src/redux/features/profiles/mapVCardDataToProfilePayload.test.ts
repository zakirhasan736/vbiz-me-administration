import { mapVCardDataToProfilePayload } from '@/redux/features/profiles/profiles.api'
import { createDefaultVCardData } from '@/types/vcard'
import { describe, expect, it } from 'vitest'

describe('mapVCardDataToProfilePayload gender', () => {
  it('sends the selected gender and relationship so save does not restore Male', () => {
    const data = createDefaultVCardData({
      personal: {
        ...createDefaultVCardData().personal,
        fullName: 'Ada Lovelace',
        gender: 'Female',
        relationship: 'Married',
      },
    })

    const payload = mapVCardDataToProfilePayload(data)

    expect(payload.gender).toBe('Female')
    expect(payload.maritalStatus).toBe('Married')
  })
})
