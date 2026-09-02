import type { MyCardData } from '@/interfaces/api/myCard'
import { buildPublicCardSeoMetadata } from '@/lib/seo/publicCardSeo'
import { resolvePublicCardSeo, resolvePublicCardShareImageUrl } from '@/lib/seo/resolvePublicCardSeo'
import { describe, expect, it } from 'vitest'

function card(partial?: Partial<MyCardData>): MyCardData {
  return {
    profile: {
      id: 'card-1',
      name: 'Michaelangelo Casanova',
      slug: 'michaelangelo-casanova-2',
      email: 'michael@example.com',
      phone: '555-0100',
      address: '',
      country: 'US',
      website: '',
      company_name: 'Casanova Group',
      designation: 'Executive Coach',
      description: 'Impressions That Last - Connections That Matter',
      profession: 'Coach',
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
    },
    settings: {},
    features: {},
    template: 'v3',
    background_media: {},
    intro_video: {},
    profile_media: { url: 'https://cdn.example.com/avatar.jpg' },
    action_buttons: {},
    my_info: {},
    ...partial,
  }
}

describe('resolvePublicCardSeo', () => {
  it('falls back to profile name, about, and avatar for share previews', () => {
    const myCard = card()
    const seo = resolvePublicCardSeo(myCard, 'michaelangelo-casanova-2')
    expect(seo.metaTitle).toBe('Michaelangelo Casanova | Executive Coach')
    expect(seo.metaDescription).toBe('Impressions That Last - Connections That Matter')

    const metadata = buildPublicCardSeoMetadata({
      slug: 'michaelangelo-casanova-2',
      origin: 'https://app.vbizme.com',
      cardPath: '/vCard/michaelangelo-casanova-2',
      myCard,
    })
    expect(metadata.openGraph?.images).toEqual([
      { url: 'https://cdn.example.com/avatar.jpg', alt: 'Michaelangelo Casanova' },
    ])
  })

  it('uses generated icon when profile media is a video and no still image exists', () => {
    const myCard = card({
      profile_media: { url: 'https://cdn.example.com/intro.mp4', is_video: true },
      profile: { ...card().profile, avatar: '' },
    })
    const image = resolvePublicCardShareImageUrl(myCard, 'https://app.vbizme.com', 'michaelangelo-casanova-2')
    expect(image).toBe('https://app.vbizme.com/vCard/michaelangelo-casanova-2/icon/512')
  })

  it('uses profile still fallback when card avatar media is a video', () => {
    const myCard = card({
      profile_media: {
        url: 'https://cdn.example.com/intro.mp4',
        is_video: true,
        fallback_url: 'https://cdn.example.com/thumb.jpg',
      },
    })
    expect(resolvePublicCardShareImageUrl(myCard, 'https://app.vbizme.com', 'michaelangelo-casanova-2')).toBe(
      'https://cdn.example.com/thumb.jpg'
    )
  })

  it('uses About Me featured image when avatar is video and no profile still exists', () => {
    const myCard = card({
      profile_media: { url: 'https://cdn.example.com/intro.mp4', is_video: true },
      settings: { about_me_featured_media_url: 'https://cdn.example.com/about-hero.jpg' },
      profile: { ...card().profile, avatar: 'https://cdn.example.com/intro.mp4' },
    })
    expect(resolvePublicCardShareImageUrl(myCard, 'https://app.vbizme.com', 'michaelangelo-casanova-2')).toBe(
      'https://cdn.example.com/about-hero.jpg'
    )
  })

  it('prefers server-resolved share preview image when present', () => {
    const myCard = card({
      profile_media: { url: 'https://cdn.example.com/intro.mp4', is_video: true },
      settings: { share_preview_image_url: 'https://cdn.example.com/about-share.jpg' },
    })
    expect(resolvePublicCardShareImageUrl(myCard, 'https://app.vbizme.com', 'michaelangelo-casanova-2')).toBe(
      'https://cdn.example.com/about-share.jpg'
    )
  })
})
