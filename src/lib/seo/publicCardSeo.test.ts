import type { MyCardData } from '@/interfaces/api/myCard'
import {
  applySeoFieldsToJsonLd,
  buildPublicCardCanonicalUrl,
  buildPublicCardJsonLd,
  buildPublicCardJsonLdGraph,
  buildPublicCardSeoMetadata,
  collectSameAsUrls,
  extractPublicSeoReviews,
  publicCardEntityType,
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
      cardPath: '/vCard/maya',
      myCard,
    })

    expect(buildPublicCardCanonicalUrl(origin, '/vCard/maya')).toBe('https://app.vbiz.me/vCard/maya')
    expect(metadata.alternates?.canonical).toBe('https://app.vbiz.me/vCard/maya')
    expect(metadata.alternates?.types?.['text/markdown']).toBe('https://app.vbiz.me/vCard/maya/llms.txt')
    expect(metadata.openGraph?.url).toBe('https://app.vbiz.me/vCard/maya')
    expect(metadata.robots).toMatchObject({ index: true, follow: true })
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

  it('puts SEO meta title, description, and keywords on JSON-LD ProfilePage', () => {
    const jsonLd = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card(),
    })
    expect(jsonLd.name).toBe('Maya Chen | Maya Design Studio | Brand Designer')
    expect(jsonLd.description).toBe('Brand systems, identity, and contact details.')
    expect(String(jsonLd.keywords)).toContain('brand designer')
    expect(String(jsonLd.keywords)).toContain('identity design')
    expect((jsonLd.mainEntity as { description?: string }).description).toBe(
      'Brand systems, identity, and contact details.'
    )
    expect((jsonLd.mainEntity as { '@type'?: string })['@type']).toBe('Person')
    expect(jsonLd['@type']).toBe('ProfilePage')
  })

  it('uses LocalBusiness when the card name is the business name', () => {
    const myCard = card({ name: 'Maya Design Studio', company_name: 'Maya Design Studio' })
    expect(publicCardEntityType(myCard.profile)).toBe('LocalBusiness')
    const jsonLd = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard,
    })
    expect(jsonLd['@type']).toBe('ProfilePage')
    expect((jsonLd.mainEntity as { '@type'?: string })['@type']).toBe('LocalBusiness')
  })

  it('marks a draft card noindex', () => {
    const metadata = buildPublicCardSeoMetadata({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card({ is_draft: true, is_public: false }),
    })
    expect(metadata.robots).toMatchObject({ index: false, follow: false })
  })

  it('patches JSON-LD when SEO meta title, description, or keywords change', () => {
    const patched = applySeoFieldsToJsonLd(
      {
        '@type': 'ProfilePage',
        name: 'Old title',
        description: 'Old description',
        keywords: 'old',
        mainEntity: { '@type': 'Person', name: 'Maya Chen', description: 'Old description' },
      },
      {
        metaTitle: 'New SEO Title',
        metaDescription: 'New SEO description',
        metaKeywords: ['new keyword', 'brand'],
      },
      'Maya Chen'
    )
    expect(patched.name).toBe('New SEO Title')
    expect(patched.description).toBe('New SEO description')
    expect(patched.keywords).toBe('new keyword, brand')
    expect((patched.mainEntity as { name: string; description: string }).name).toBe('Maya Chen')
    expect((patched.mainEntity as { description: string }).description).toBe('New SEO description')
  })

  it('adds review markup only when real reviews exist', () => {
    const withReviews = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card(),
      reviews: [{ author: 'Pat', text: 'Clear, fast work.', rating: 5 }],
    })
    const withoutReviews = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card(),
      reviews: [],
    })
    const person = withReviews.mainEntity as Record<string, unknown>
    const emptyPerson = withoutReviews.mainEntity as Record<string, unknown>

    expect(withReviews.aggregateRating).toMatchObject({ reviewCount: 1, ratingValue: 5 })
    expect(withReviews.review).toHaveLength(1)
    expect(person.aggregateRating).toBeUndefined()
    expect(person.review).toBeUndefined()
    expect(withoutReviews.aggregateRating).toBeUndefined()
    expect(emptyPerson.aggregateRating).toBeUndefined()
    expect(emptyPerson.review).toBeUndefined()
  })

  it('puts reviews on a LocalBusiness and keeps the postal code', () => {
    const myCard = card({
      name: 'Maya Design Studio',
      company_name: 'Maya Design Studio',
      zip_code: '06051',
      website: 'not a website',
    })
    const jsonLd = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard,
      reviews: [{ author: 'Pat', text: 'Clear, fast work.', rating: 5 }],
    })
    const business = jsonLd.mainEntity as {
      review?: unknown[]
      address?: { postalCode?: string }
      sameAs?: string[]
    }
    expect(business.review).toHaveLength(1)
    expect(jsonLd.review).toBeUndefined()
    expect(business.address?.postalCode).toBe('06051')
    expect(business.sameAs?.some((url) => url.includes('not a website'))).toBe(false)
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

  it('puts ProfilePage, FAQ, reviews, and products in one JSON-LD graph', () => {
    const graph = buildPublicCardJsonLdGraph(
      {
        slug: 'maya',
        origin: 'https://app.vbiz.me',
        cardPath: '/vCard/maya',
        myCard: card(),
        reviews: [{ author: 'Sam', text: 'Great service', rating: 5 }],
      },
      {
        faqs: [{ question: 'Do you ship?', answer: 'Yes, nationwide.' }],
        products: [
          { name: 'Brand kit', description: 'Logo and cards', price: '49', image: '' },
          { name: 'Consult', description: 'Talk to us', price: 'Call', image: '' },
        ],
      }
    )
    const nodes = graph['@graph'] as Array<Record<string, unknown>>
    const page = nodes.find((node) => node['@type'] === 'ProfilePage')
    const faq = nodes.find((node) => node['@type'] === 'FAQPage')
    const product = nodes.find((node) => node['@type'] === 'Product')
    expect(page?.url).toBe('https://app.vbiz.me/vCard/maya')
    expect(page?.review as unknown[]).toHaveLength(1)
    expect((page?.mainEntity as { review?: unknown }).review).toBeUndefined()
    expect(faq?.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Do you ship?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes, nationwide.' },
      },
    ])
    expect(nodes.filter((node) => node['@type'] === 'Product')).toHaveLength(1)
    expect(product).toMatchObject({
      name: 'Brand kit',
      description: 'Logo and cards. Price 49',
      offers: { '@type': 'Offer', price: '49', priceCurrency: 'USD' },
    })
  })
})
