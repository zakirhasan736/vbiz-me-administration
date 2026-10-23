import {
  buildPublicCardManifest,
  resolvePwaAvatarCandidates,
  resolvePwaInstallPreviewIconUrl,
} from '@/lib/pwa/resolvePublicCardPwa'
import type { MyCardData } from '@interfaces/api/myCard'
import { describe, expect, it } from 'vitest'

describe('public card PWA manifest', () => {
  it('keeps start_url inside scope so Chrome/Android can show Install', () => {
    const manifest = buildPublicCardManifest(null, 'ada-lovelace')
    expect(manifest.start_url).toBe('/vCard/ada-lovelace')
    expect(manifest.scope).toBe('/vCard/ada-lovelace')
    expect(manifest.start_url.startsWith(manifest.scope)).toBe(true)
    expect(manifest.display).toBe('standalone')
    expect(manifest.icons.some((icon) => icon.sizes === '192x192' && icon.purpose === 'any')).toBe(true)
    expect(manifest.icons.some((icon) => icon.sizes === '512x512' && icon.purpose === 'any')).toBe(true)
  })

  it('prefers the Card Settings Home Screen icon, then this card profile, About Me, then other stills', () => {
    const urls = resolvePwaAvatarCandidates({
      settings: {
        pwa_home_screen_icon_url: 'https://cdn.example.com/pwa-icon.png',
        seo_image_url: 'https://cdn.example.com/og.jpg',
        about_me_featured_media_url: 'https://cdn.example.com/about.jpg',
        company_logo: 'https://cdn.example.com/logo.png',
        profile_media_url: 'https://cdn.example.com/hero.jpg',
      },
      profile: { avatar: 'https://cdn.example.com/avatar.jpg' },
      profile_media: { url: 'https://cdn.example.com/intro.mp4', is_video: true, fallback_url: '' },
    } as unknown as MyCardData)

    expect(urls.slice(0, 5)).toEqual([
      'https://cdn.example.com/pwa-icon.png',
      'https://cdn.example.com/hero.jpg',
      'https://cdn.example.com/avatar.jpg',
      'https://cdn.example.com/about.jpg',
      'https://cdn.example.com/og.jpg',
    ])
    expect(urls).toContain('https://cdn.example.com/logo.png')
    expect(urls).not.toContain('https://cdn.example.com/intro.mp4')
  })

  it('prefers linked-card profile_media_url over a stale corporate owner avatar', () => {
    const urls = resolvePwaAvatarCandidates({
      settings: {
        profile_media_url: 'https://cdn.example.com/member.jpg',
        about_me_featured_media_url: 'https://cdn.example.com/about.jpg',
      },
      profile: { avatar: 'https://cdn.example.com/owner-from-duplicate.jpg' },
    } as unknown as MyCardData)

    expect(urls.slice(0, 3)).toEqual([
      'https://cdn.example.com/member.jpg',
      'https://cdn.example.com/owner-from-duplicate.jpg',
      'https://cdn.example.com/about.jpg',
    ])
  })

  it('falls back to avatar → About Me → Open Graph when no Home Screen icon is set', () => {
    const urls = resolvePwaAvatarCandidates({
      settings: {
        seo_image_url: 'https://cdn.example.com/og.jpg',
        about_me_featured_media_url: 'https://cdn.example.com/about.jpg',
      },
      profile: { avatar: 'https://cdn.example.com/avatar.jpg' },
    } as unknown as MyCardData)

    expect(urls.slice(0, 3)).toEqual([
      'https://cdn.example.com/avatar.jpg',
      'https://cdn.example.com/about.jpg',
      'https://cdn.example.com/og.jpg',
    ])
  })

  it('skips a video avatar and uses the About Me image', () => {
    const urls = resolvePwaAvatarCandidates({
      settings: {
        about_me_featured_media_url: 'https://cdn.example.com/about.jpg',
        seo_image_url: 'https://cdn.example.com/og.jpg',
      },
      profile: { avatar: 'https://cdn.example.com/avatar.mp4' },
    } as unknown as MyCardData)

    expect(urls[0]).toBe('https://cdn.example.com/about.jpg')
    expect(urls[1]).toBe('https://cdn.example.com/og.jpg')
  })

  it('resolves install-modal preview as Home Screen icon → profile → About Me', () => {
    expect(
      resolvePwaInstallPreviewIconUrl({
        pwaHomeScreenIconUrl: 'https://cdn.example.com/pwa.png',
        profileImageUrl: 'https://cdn.example.com/profile.jpg',
        aboutMeImageUrl: 'https://cdn.example.com/about.jpg',
        fallbackIconPath: '/vCard/mila/icon/192',
      })
    ).toBe('https://cdn.example.com/pwa.png')

    expect(
      resolvePwaInstallPreviewIconUrl({
        profileImageUrl: 'https://cdn.example.com/profile.jpg',
        aboutMeImageUrl: 'https://cdn.example.com/about.jpg',
        fallbackIconPath: '/vCard/mila/icon/192',
      })
    ).toBe('https://cdn.example.com/profile.jpg')

    expect(
      resolvePwaInstallPreviewIconUrl({
        aboutMeImageUrl: 'https://cdn.example.com/about.jpg',
        fallbackIconPath: '/vCard/mila/icon/192',
      })
    ).toBe('https://cdn.example.com/about.jpg')

    expect(
      resolvePwaInstallPreviewIconUrl({
        fallbackIconPath: '/vCard/mila/icon/192',
      })
    ).toBe('/vCard/mila/icon/192')
  })
})
