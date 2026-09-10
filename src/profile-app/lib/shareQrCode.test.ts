import { resolveShareQrCenterSources } from '@/profile-app/lib/shareQrCode'
import { describe, expect, it } from 'vitest'

describe('resolveShareQrCenterSources', () => {
  it('prefers avatar, then profile area, then About Me still images', () => {
    expect(
      resolveShareQrCenterSources({
        avatarUrl: 'https://cdn.example.com/avatar.jpg',
        profileMediaUrl: 'https://cdn.example.com/profile.jpg',
        aboutMeMediaUrl: 'https://cdn.example.com/about.jpg',
      })
    ).toEqual({ imageUrl: 'https://cdn.example.com/avatar.jpg', videoUrl: '' })

    expect(
      resolveShareQrCenterSources({
        avatarUrl: '',
        profileMediaUrl: 'https://cdn.example.com/profile.jpg',
        aboutMeMediaUrl: 'https://cdn.example.com/about.jpg',
      })
    ).toEqual({ imageUrl: 'https://cdn.example.com/profile.jpg', videoUrl: '' })

    expect(
      resolveShareQrCenterSources({
        avatarUrl: 'https://cdn.example.com/avatar.mp4',
        profileMediaUrl: '',
        aboutMeMediaUrl: 'https://cdn.example.com/about.jpg',
      })
    ).toEqual({ imageUrl: 'https://cdn.example.com/about.jpg', videoUrl: '' })
  })

  it('falls back to video when no still image is available', () => {
    expect(
      resolveShareQrCenterSources({
        avatarUrl: '',
        profileMediaUrl: 'https://cdn.example.com/profile.mp4',
        aboutMeMediaUrl: '',
        introVideoUrl: 'https://cdn.example.com/intro.mp4',
      })
    ).toEqual({ imageUrl: '', videoUrl: 'https://cdn.example.com/profile.mp4' })
  })
})
