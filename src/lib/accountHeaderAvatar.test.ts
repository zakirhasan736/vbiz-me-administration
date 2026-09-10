import { resolveAccountHeaderAvatarUrl } from '@/lib/accountHeaderAvatar'
import type { ApiProfile } from '@/redux/features/profiles/profiles.api'

describe('resolveAccountHeaderAvatarUrl', () => {
  it('prefers account avatar over card media', () => {
    const profiles = [
      {
        id: '1',
        slug: 'a',
        name: 'A',
        email: 'a@example.com',
        avatar: 'https://cdn.example.com/card.jpg',
        settings: [{ key: 'about_me_featured_media_url', value: 'https://cdn.example.com/about.jpg' }],
      },
    ] as ApiProfile[]

    expect(resolveAccountHeaderAvatarUrl('https://cdn.example.com/account.jpg', profiles)).toBe(
      'https://cdn.example.com/account.jpg'
    )
  })

  it('uses card avatar when account avatar is missing', () => {
    const profiles = [
      {
        id: '1',
        slug: 'a',
        name: 'A',
        email: 'a@example.com',
        avatar: 'https://cdn.example.com/card.jpg',
      },
    ] as ApiProfile[]

    expect(resolveAccountHeaderAvatarUrl(null, profiles)).toBe('https://cdn.example.com/card.jpg')
  })

  it('falls back to About Me featured image', () => {
    const profiles = [
      {
        id: '1',
        slug: 'a',
        name: 'A',
        email: 'a@example.com',
        avatar: 'https://cdn.example.com/intro.mp4',
        settings: [{ key: 'about_me_featured_media_url', value: 'https://cdn.example.com/about.jpg' }],
      },
    ] as ApiProfile[]

    expect(resolveAccountHeaderAvatarUrl(undefined, profiles)).toBe('https://cdn.example.com/about.jpg')
  })

  it('returns null when nothing usable exists', () => {
    expect(resolveAccountHeaderAvatarUrl(null, [])).toBeNull()
    expect(resolveAccountHeaderAvatarUrl('https://cdn.example.com/x.mp4', null)).toBeNull()
  })
})
