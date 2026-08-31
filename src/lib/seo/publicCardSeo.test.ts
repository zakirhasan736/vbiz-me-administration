import type { MyCardData } from '@/interfaces/api/myCard'
import {
  buildPublicCardCanonicalUrl,
  buildPublicCardJsonLd,
  buildPublicCardSeoMetadata,
  collectSameAsUrls,
  extractPublicSeoReviews,
  resolvePublicOrigin,
} from '@/lib/seo/publicCardSeo'
import { describe, expect, it } from 'vitest'

function card(partial?: Partial<MyCardData['profile']>): MyCardData {
  return {
    profile: {
      id: 'card-1',
      name: 'Maya Chen',
      slug: 'maya',
      email: 'maya@studio.test',
      phone: '555-0100',
      address: '12 Market Street',
      country: 'US',
      website: 'studio.test',
      company_name: 'Maya Design Studio',
      designation: 'Brand Designer',
      description: 'Brand systems for growing teams.',
      profession: 'Designer',
      gender: null,
      marital_status: null,
      facebook: 'mayastudio',
      instagram: '@maya.design',
      twitter: null,
      tiktok: null,
      youtube: null,
      rumble: null,
      truth: null,
      linkedin: 'maya-chen',
      pinterest: null,
      whatsapp: null,
      ...partial,
    },
    settings: {
      seo_meta_title: 'Maya Design Studio | Brand Designer',
      seo_meta_description: 'Brand systems, identity, and contact details.',
      seo_meta_keywords_json: JSON.stringify(['vbizme', 'brand designer', 'identity design']),
    },
    features: {},
    template: 'v3',
    background_media: {},
    intro_video: {},
    profile_media: { url: 'https://cdn.example.com/maya.jpg' },
    action_buttons: {},
    my_info: {},
  }
}

describe('public card SEO', () => {
  it('builds canonical, Open Graph, and social sameAs from personal information', () => {
    const myCard = card()
    const origin = resolvePublicOrigin('https://app.vbiz.me')
    const metadata = buildPublicCardSeoMetadata({
      slug: 'maya',
      origin,
      cardPath: '/v/maya',
      myCard,
    })

    expect(buildPublicCardCanonicalUrl(origin, '/v/maya')).toBe('https://app.vbiz.me/v/maya')
    expect(metadata.alternates?.canonical).toBe('https://app.vbiz.me/v/maya')
    expect(metadata.openGraph?.url).toBe('https://app.vbiz.me/v/maya')
    expect(metadata.keywords).toEqual([
      'vbizme',
      'vbiz me',
      'virtual card',
      'digital business card',
      'online business card',
      'brand designer',
      'identity design',
      'Maya Chen',
      'Maya Design Studio',
    ])
    expect(metadata.openGraph?.images).toEqual([{ url: 'https://cdn.example.com/maya.jpg', alt: 'Maya Chen' }])
    expect(collectSameAsUrls(myCard.profile)).toEqual([
      'https://facebook.com/mayastudio',
      'https://instagram.com/maya.design',
      'https://linkedin.com/in/maya-chen',
      'https://studio.test',
    ])
  })

  it('adds review markup only when real reviews exist', () => {
    const withReviews = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/v/maya',
      myCard: card(),
      reviews: [{ author: 'Pat', text: 'Clear, fast work.', rating: 5 }],
    })
    const withoutReviews = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/v/maya',
      myCard: card(),
      reviews: [],
    })
    const person = withReviews.mainEntity as Record<string, unknown>
    const emptyPerson = withoutReviews.mainEntity as Record<string, unknown>

    expect(person.aggregateRating).toMatchObject({ reviewCount: 1, ratingValue: 5 })
    expect(emptyPerson.aggregateRating).toBeUndefined()
    expect(emptyPerson.review).toBeUndefined()
  })

  it('ignores leave-a-review link cards when extracting reviews', () => {
    const reviews = extractPublicSeoReviews({
      items: [
        {
          title: 'Leave a Review',
          description: '',
          review_link: { has_link: true, url: 'https://g.page/r' },
          status: 1,
        },
        { title: 'Sam', description: 'Great service', rating: 5, status: 1 },
      ],
    })
    expect(reviews).toEqual([{ author: 'Sam', text: 'Great service', rating: 5 }])
  })
})
