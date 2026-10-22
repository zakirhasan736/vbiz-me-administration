import type { MyCardData } from '@/interfaces/api/myCard'
import {
  applySeoFieldsToJsonLd,
  buildPublicCardCanonicalUrl,
  buildPublicCardJsonLd,
  buildPublicCardJsonLdGraph,
  buildPublicCardSeoMetadata,
  cleanSameAsUrl,
  collectSameAsUrls,
  extractPublicSeoProducts,
  extractPublicSeoReviews,
  isSchemaEligibleProduct,
  publicCardEntityType,
  resolvePublicOrigin,
  toSchemaTelephone,
  VBIZ_ME_ORGANIZATION_ID,
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

function graphNodes(graph: Record<string, unknown>) {
  return graph['@graph'] as Array<Record<string, unknown>>
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
    expect(jsonLd.review).toBeUndefined()
    expect(jsonLd.aggregateRating).toBeUndefined()
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

  it('patches @graph ProfilePage without creating a duplicate page node', () => {
    const patched = applySeoFieldsToJsonLd(
      {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'ProfilePage',
            '@id': 'https://app.vbiz.me/vCard/maya#page',
            name: 'Old',
            mainEntity: { '@id': 'https://app.vbiz.me/vCard/maya#person' },
          },
          {
            '@type': 'Person',
            '@id': 'https://app.vbiz.me/vCard/maya#person',
            name: 'Maya Chen',
            description: 'Old',
          },
        ],
      },
      { metaTitle: 'New Title', metaDescription: 'New description', metaKeywords: ['a'] },
      'Maya Chen'
    )
    const nodes = graphNodes(patched)
    expect(nodes.filter((node) => node['@type'] === 'ProfilePage')).toHaveLength(1)
    expect(nodes[0]?.name).toBe('New Title')
    expect(nodes[1]?.description).toBe('New description')
  })

  it('never emits Review or AggregateRating markup', () => {
    const withReviews = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card(),
      reviews: [{ author: 'Pat', text: 'Clear, fast work.', rating: 5 }],
    })
    const businessCard = card({
      name: 'Maya Design Studio',
      company_name: 'Maya Design Studio',
      zip_code: '06051',
    })
    const business = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: businessCard,
      reviews: [{ author: 'Pat', text: 'Clear, fast work.', rating: 5 }],
    })
    const graph = buildPublicCardJsonLdGraph({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card(),
      reviews: [{ author: 'Sam', text: 'Great service', rating: 5 }],
    })

    expect(withReviews.aggregateRating).toBeUndefined()
    expect(withReviews.review).toBeUndefined()
    expect((withReviews.mainEntity as Record<string, unknown>).aggregateRating).toBeUndefined()
    expect((business.mainEntity as Record<string, unknown>).review).toBeUndefined()
    expect(JSON.stringify(graph)).not.toMatch(/AggregateRating|"@type":"Review"/)
  })

  it('omits streetAddress when the address field is only city and state', () => {
    const jsonLd = buildPublicCardJsonLd({
      slug: 'maya',
      origin: 'https://app.vbiz.me',
      cardPath: '/vCard/maya',
      myCard: card({
        address: 'New Britain, CT',
        city: '',
        state: '',
        zip_code: '06051',
        country: 'US',
      }),
    })
    const address = (jsonLd.mainEntity as { address?: Record<string, string> }).address
    expect(address?.streetAddress).toBeUndefined()
    expect(address?.addressLocality).toBe('New Britain')
    expect(address?.addressRegion).toBe('CT')
    expect(address?.postalCode).toBe('06051')
    expect(address?.addressCountry).toBe('US')
  })

  it('formats US phones for schema and cleans sameAs URLs', () => {
    expect(toSchemaTelephone('(860) 770-9893')).toBe('+1-860-770-9893')
    expect(cleanSameAsUrl('https://www.tiktok.com/@vbiz.me?_r=1&_t=abc')).toBe('https://www.tiktok.com/@vbiz.me')
    expect(cleanSameAsUrl('https://wa.me/18607709893')).toBe('')
  })

  it('blocks empty and test products from schema', () => {
    expect(isSchemaEligibleProduct({ name: 'test title', description: 'x', price: '10', image: '' })).toBe(false)
    expect(isSchemaEligibleProduct({ name: 'Brand kit', description: 'Logo', price: '49', image: '' })).toBe(true)
    const products = extractPublicSeoProducts({
      items: [
        { title: 'test title', description: 'ignore', offerPrice: '9', status: 1 },
        { title: 'Brand kit', description: 'Logo and cards', offerPrice: '49', status: 1 },
        { title: 'Consult', description: 'Talk', offerPrice: 'Call', status: 1 },
      ],
    })
    expect(products.map((p) => p.name)).toEqual(['Brand kit'])
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

  it('applies the same schema rules to every public card slug', () => {
    const fixtures = [
      {
        slug: 'sheldon-singleton',
        name: 'Sheldon Singleton',
        company_name: 'Black Swan Insurance Group',
        designation: 'Life and Annuity Insurance Agent',
        address: 'Hartford, CT',
        phone: '(860) 555-0101',
        services: [{ name: 'Life Insurance', description: 'Coverage for families.' }],
      },
      {
        slug: 'michael-donnelly',
        name: 'Michael Donnelly',
        company_name: 'The Paddock Classic Car Restorations',
        designation: 'Owner',
        address: '12 Shop Road',
        city: 'New Britain',
        state: 'CT',
        phone: '8605550199',
        services: [{ name: 'Classic Restoration', description: 'Full body and mechanical work.' }],
      },
      {
        slug: 'michaelangelo-casanova-2',
        name: 'Michaelangelo Casanova',
        company_name: 'vBiz Me',
        designation: 'CEO & Founder',
        address: 'New Britain, CT',
        zip_code: '06051',
        phone: '(860) 770-9893',
        services: [{ name: 'Digital Business Card Design & Setup', description: 'Interactive vBiz Me cards.' }],
      },
    ]

    for (const fixture of fixtures) {
      const graph = buildPublicCardJsonLdGraph(
        {
          slug: fixture.slug,
          origin: 'https://app.vbizme.com',
          cardPath: `/vCard/${fixture.slug}`,
          myCard: card({
            name: fixture.name,
            slug: fixture.slug,
            company_name: fixture.company_name,
            designation: fixture.designation,
            address: fixture.address,
            city: fixture.city ?? '',
            state: fixture.state ?? '',
            zip_code: fixture.zip_code ?? '',
            phone: fixture.phone,
          }),
          reviews: [{ author: '⭐⭐⭐⭐⭐ "Game-Changer"', text: 'Great', rating: 5 }],
        },
        {
          services: fixture.services,
          products: [
            { name: 'test title', description: 'should never appear', price: '1', image: '' },
            { name: 'Real Offer', description: 'Paid package', price: '99', image: '' },
          ],
        }
      )
      const nodes = graphNodes(graph)
      const serialized = JSON.stringify(graph)
      const page = nodes.filter((node) => node['@type'] === 'ProfilePage')
      const entity = nodes.find((node) => node['@type'] === 'Person' || node['@type'] === 'LocalBusiness')
      const address = entity?.address as Record<string, string> | undefined

      expect(page, fixture.slug).toHaveLength(1)
      expect(serialized, fixture.slug).not.toMatch(/AggregateRating|"@type":"Review"/)
      expect(serialized, fixture.slug).not.toContain('test title')
      expect(
        nodes.some((node) => node['@id'] === VBIZ_ME_ORGANIZATION_ID),
        fixture.slug
      ).toBe(true)
      expect(entity?.makesOffer, fixture.slug).toEqual([
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: fixture.services[0].name,
            description: fixture.services[0].description,
          },
        },
      ])
      if (fixture.address.includes(',') && !/\d/.test(fixture.address)) {
        expect(address?.streetAddress, fixture.slug).toBeUndefined()
      }
      expect(
        nodes.filter((node) => node['@type'] === 'Product'),
        fixture.slug
      ).toHaveLength(1)
    }
  })

  it('puts ProfilePage, Person, shared Organization, FAQ, services, and products in one JSON-LD graph', () => {
    const graph = buildPublicCardJsonLdGraph(
      {
        slug: 'maya',
        origin: 'https://app.vbiz.me',
        cardPath: '/vCard/maya',
        myCard: card({ company_name: 'vBiz Me', phone: '(860) 770-9893' }),
        reviews: [{ author: 'Sam', text: 'Great service', rating: 5 }],
      },
      {
        faqs: [{ question: 'Do you ship?', answer: 'Yes, nationwide.' }],
        products: [
          { name: 'Brand kit', description: 'Logo and cards', price: '49', image: '' },
          { name: 'test title', description: 'ignore', price: '9', image: '' },
          { name: 'Consult', description: 'Talk to us', price: 'Call', image: '' },
        ],
        services: [
          {
            name: 'Digital Business Card Design & Setup',
            description: 'A professional interactive card.',
          },
        ],
      }
    )
    const nodes = graphNodes(graph)
    const page = nodes.find((node) => node['@type'] === 'ProfilePage')
    const person = nodes.find((node) => node['@type'] === 'Person')
    const org = nodes.find((node) => node['@id'] === VBIZ_ME_ORGANIZATION_ID)
    const website = nodes.find((node) => node['@type'] === 'WebSite')
    const faq = nodes.find((node) => node['@type'] === 'FAQPage')
    const products = nodes.filter((node) => node['@type'] === 'Product')

    expect(nodes.filter((node) => node['@type'] === 'ProfilePage')).toHaveLength(1)
    expect(page?.url).toBe('https://app.vbiz.me/vCard/maya')
    expect(page?.review).toBeUndefined()
    expect(page?.mainEntity).toEqual({ '@id': 'https://app.vbiz.me/vCard/maya#person' })
    expect(person?.telephone).toBe('+1-860-770-9893')
    expect(person?.worksFor).toEqual({ '@id': VBIZ_ME_ORGANIZATION_ID })
    expect(person?.makesOffer).toEqual([
      {
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: 'Digital Business Card Design & Setup',
          description: 'A professional interactive card.',
        },
      },
    ])
    expect(org).toMatchObject({
      '@type': 'Organization',
      name: 'vBiz Me',
      url: 'https://www.vbizme.com',
    })
    expect(website?.publisher).toEqual({ '@id': VBIZ_ME_ORGANIZATION_ID })
    expect(faq?.mainEntity).toEqual([
      {
        '@type': 'Question',
        name: 'Do you ship?',
        acceptedAnswer: { '@type': 'Answer', text: 'Yes, nationwide.' },
      },
    ])
    expect(products).toHaveLength(1)
    expect(products[0]).toMatchObject({
      name: 'Brand kit',
      offers: { '@type': 'Offer', price: '49', priceCurrency: 'USD' },
    })
  })
})
