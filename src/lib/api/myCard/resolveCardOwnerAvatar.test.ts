import { describe, expect, it } from 'vitest'

import { resolveCardOwnerAvatarUrl } from '@/lib/api/myCard/mapMyCard'
import type { MyCardData } from '@interfaces/api/myCard'

function baseCard(overrides: Partial<MyCardData> = {}): MyCardData {
  return {
    profile: {
      id: 1,
      name: 'Owner',
      slug: 'owner',
      email: null,
      phone: null,
      address: null,
      country: null,
      website: null,
      company_name: null,
      designation: null,
      description: null,
      profession: null,
      gender: null,
      marital_status: null,
      facebook: null,
      instagram: null,
      twitter: null,
      tiktok: null,
      youtube: null,
      rumble: null,
      truth: null,
      linkedin: null,
      pinterest: null,
      whatsapp: null,
      avatar: null,
    },
    settings: {},
    features: {},
    checkboxes: {},
    profile_media: {},
    background_media: {},
    intro_video: {},
    background_audio: {},
    action_buttons: {},
    my_info: {},
    ...overrides,
  } as MyCardData
}

describe('resolveCardOwnerAvatarUrl', () => {
  it('returns a video profile avatar URL for card lists', () => {
    const url = 'https://cdn.example.com/avatar.mp4'
    expect(
      resolveCardOwnerAvatarUrl(
        baseCard({
          settings: { profile_media_url: url },
          profile_media: { url, is_video: true },
        })
      )
    ).toBe(url)
  })

  it('returns a still profile avatar URL', () => {
    const url = 'https://cdn.example.com/avatar.jpg'
    expect(
      resolveCardOwnerAvatarUrl(
        baseCard({
          profile_media: { url, is_video: false },
        })
      )
    ).toBe(url)
  })
})
