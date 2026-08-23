import type { AdminProfileRow } from '@/redux/features/adminProfiles/adminProfiles.api'
import { describe, expect, it } from 'vitest'
import { profileOwnerSelectionFromRow } from './ProfileOwnerPicker'

describe('profile owner announcement selection', () => {
  it('targets linked login accounts and exposes professional identity', () => {
    const row = {
      id: 'profile-1',
      name: 'Abdul Aziz',
      email: 'public@example.com',
      companyName: 'Hunza WebX',
      designation: 'Managing Director',
      slug: 'abdul-aziz',
      profession: { id: 'profession-1', name: 'Software Consultant' },
      user: { id: 'owner-1', name: 'Abdul Aziz', email: 'owner@example.com', role: 'vcard-owner' },
      companyUser: {
        id: 'corporate-1',
        name: 'Hunza Corporate',
        email: 'corporate@example.com',
        role: 'corporate-owner',
      },
    } as AdminProfileRow

    expect(profileOwnerSelectionFromRow(row)).toEqual({
      profileId: 'profile-1',
      hostName: 'Abdul Aziz',
      ownerEmails: ['owner@example.com', 'corporate@example.com'],
      identity: 'Managing Director · Software Consultant · Hunza WebX · Abdul Aziz · owner@example.com · /abdul-aziz',
    })
  })
})
