import { resolveShareQrCenterSources, shareQrOwnerInitials } from '@/profile-app/lib/shareQrCode'
import { describe, expect, it } from 'vitest'

describe('shareQrOwnerInitials', () => {
  it('builds cap letters from owner name', () => {
    expect(shareQrOwnerInitials('Zakir Hosen')).toBe('ZH')
    expect(shareQrOwnerInitials('Zakir')).toBe('Z')
    expect(shareQrOwnerInitials('  Ada  Lovelace  Byron ')).toBe('AL')
  })
})

describe('resolveShareQrCenterSources', () => {
  it('prefers avatar, then profile area, then About Me still images', () => {
    expect(
      resolveShareQrCenterSources({
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        profileMediaUrl: 'https://cdn.example.com/profile.jpg',
        aboutMeMediaUrl: 'https://cdn.example.com/about.jpg',
      })
    ).toMatchObject({
      imageUrl: 'https://cdn.example.com/avatar.jpg',
      imageUrls: [
        'https://cdn.example.com/avatar.jpg',
        'https://cdn.example.com/profile.jpg',
        'https://cdn.example.com/about.jpg',
      ],
    })

    expect(
      resolveShareQrCenterSources({
        avatarUrl: '',
        profileMediaUrl: 'https://cdn.example.com/profile.jpg',
        aboutMeMediaUrl: 'https://cdn.example.com/about.jpg',
      })
    ).toMatchObject({ imageUrl: 'https://cdn.example.com/profile.jpg' })

    expect(
      resolveShareQrCenterSources({
        avatarUrl: 'https://cdn.example.com/avatar.mp4',
        profileMediaUrl: '',
        aboutMeMediaUrl: 'https://cdn.example.com/about.jpg',
      })
    ).toMatchObject({
      imageUrl: 'https://cdn.example.com/about.jpg',
      videoUrls: ['https://cdn.example.com/avatar.mp4'],
    })
  })

  it('falls back to video when no still image is available', () => {
    expect(
      resolveShareQrCenterSources({
        avatarUrl: '',
        profileMediaUrl: 'https://cdn.example.com/profile.mp4',
        aboutMeMediaUrl: '',
        introVideoUrl: 'https://cdn.example.com/intro.mp4',
      })
    ).toMatchObject({
      imageUrl: '',
      videoUrl: 'https://cdn.example.com/profile.mp4',
      videoUrls: ['https://cdn.example.com/profile.mp4', 'https://cdn.example.com/intro.mp4'],
    })
  })
})
