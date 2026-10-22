import type { MyCardData, MyCardProfile } from '@/interfaces/api/myCard'
import { resolvePublicCardSeo, resolvePublicCardShareImageUrl } from '@/lib/seo/resolvePublicCardSeo'
import { socialHandleUrl } from '@/lib/vcardSocial'
import type { Metadata } from 'next'

/** Shared platform Organization every public card links to (publisher / isPartOf). */
export const VBIZ_ME_ORGANIZATION_ID = 'https://www.vbizme.com/#organization'
export const VBIZ_ME_ORGANIZATION_URL = 'https://www.vbizme.com'
export const VBIZ_ME_ORGANIZATION_NAME = 'vBiz Me'
export const VBIZ_ME_ORGANIZATION_LOGO = 'https://app.vbizme.com/logo-vbizme.webp'

const SOCIAL_PROFILE_KEYS = [
  'facebook',
  'instagram',
  'twitter',
  'tiktok',
  'youtube',
  'rumble',
  'truth',
  'linkedin',
  'pinterest',
] as const

export type PublicSeoReview = {
  author: string
  text: string
  rating: number
}

export type PublicSeoFaq = {
  question: string
  answer: string
}

export type PublicSeoProduct = {
  name: string
  description: string
  price: string
  image: string
}

export type PublicSeoService = {
  name: string
  description: string
}

export type PublicCardSeoReviews = {
  slides: Array<{
    title?: string
    plainDescription?: string
    isLinkCard?: boolean
    rating?: number
  }>
}

export type PublicCardSeoInput = {
  slug: string
  origin: string
  cardPath: string
  myCard: MyCardData
  reviews?: PublicCardSeoReviews | PublicSeoReview[] | null
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function isSchemaHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return (url.protocol === 'http:' || url.protocol === 'https:') && url.hostname.includes('.')
  } catch {
    return false
  }
}

function isSchemaEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

/** Numeric price for a Product offer. Non-prices stay out of Product markup. */
export function parseProductOffer(price: string): { price: string; priceCurrency: string } | null {
  const text = price.trim()
  if (!text) return null
  let priceCurrency = 'USD'
  if (/€|\bEUR\b/i.test(text)) priceCurrency = 'EUR'
  else if (/£|\bGBP\b/i.test(text)) priceCurrency = 'GBP'
  else if (/\bCAD\b|C\$/i.test(text)) priceCurrency = 'CAD'
  else if (/\bAUD\b|A\$/i.test(text)) priceCurrency = 'AUD'
  const match = text.replace(/,/g, '').match(/(\d+(?:\.\d{1,2})?)/)
  if (!match) return null
  return { price: match[1], priceCurrency }
}

/** The origin the browser is actually on. PWA manifest/icons must be same-origin. */
export function resolveRequestOrigin(host?: string | null, proto?: string | null): string {
  const hostname = host?.split(',')[0]?.trim()
  const protocol = (proto?.split(',')[0]?.trim() || 'https').replace(/:$/, '')
  if (hostname) return `${protocol}://${hostname}`
  return 'https://vbiz.me'
}

export function resolvePublicOrigin(envUrl?: string | null, host?: string | null, proto?: string | null): string {
  const fromEnv = envUrl?.trim().replace(/\/$/, '')
  if (fromEnv) return fromEnv
  return resolveRequestOrigin(host, proto)
}

export function toAbsoluteUrl(origin: string, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return `${origin.replace(/\/$/, '')}${trimmed}`
  return trimmed
}

export function buildPublicCardCanonicalUrl(origin: string, cardPath: string): string {
  const path = cardPath.startsWith('/') ? cardPath : `/${cardPath}`
  return `${origin.replace(/\/$/, '')}${path}`
}

/** Strip tracking query params; drop messaging deep-links that are not profile pages. */
export function cleanSameAsUrl(raw: string): string {
  const value = raw.trim()
  if (!value) return ''
  try {
    const url = new URL(value.startsWith('http') ? value : `https://${value}`)
    if (!isSchemaHttpUrl(url.toString())) return ''
    const host = url.hostname.replace(/^www\./i, '').toLowerCase()
    if (host === 'wa.me' || host === 'api.whatsapp.com' || host === 'chat.whatsapp.com') return ''
    url.hash = ''
    for (const key of [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'utm_id',
      'fbclid',
      'gclid',
      '_r',
      '_t',
      'ref',
    ]) {
      url.searchParams.delete(key)
    }
    if (host.endsWith('tiktok.com') || host.endsWith('facebook.com') || host.endsWith('instagram.com')) {
      for (const key of [...url.searchParams.keys()]) url.searchParams.delete(key)
    }
    let cleaned = url.toString()
    if (cleaned.endsWith('/') && url.pathname !== '/') cleaned = cleaned.slice(0, -1)
    return cleaned
  } catch {
    return ''
  }
}

export function collectSameAsUrls(profile: MyCardProfile): string[] {
  const urls: string[] = []
  const seen = new Set<string>()
  const push = (raw: string) => {
    const cleaned = cleanSameAsUrl(raw)
    if (!cleaned || seen.has(cleaned.toLowerCase())) return
    seen.add(cleaned.toLowerCase())
    urls.push(cleaned)
  }

  for (const key of SOCIAL_PROFILE_KEYS) {
    const handle = profile[key]
    if (!handle?.trim()) continue
    const href = socialHandleUrl(key, handle)
    if (href) push(href)
  }

  // Website belongs on worksFor.url / Organization.url, not sameAs.
  return urls
}

/** Format phone for schema.org telephone (prefer E.164-style US display). */
export function toSchemaTelephone(phone: string): string | undefined {
  const trimmed = phone.trim()
  if (!trimmed) return undefined
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 10) {
    return `+1-${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
  }
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1-${digits.slice(1, 4)}-${digits.slice(4, 7)}-${digits.slice(7)}`
  }
  if (trimmed.startsWith('+')) return trimmed
  return trimmed
}

function isVbizMeCompanyName(name: string): boolean {
  const normalized = name.trim().toLowerCase().replace(/\s+/g, ' ')
  return normalized === 'vbiz me' || normalized === 'vbizme' || normalized === 'vbiz.me'
}

export function resolvePublicCardImageUrl(myCard: MyCardData, origin: string, slug?: string): string {
  return resolvePublicCardShareImageUrl(myCard, origin, slug || myCard.profile.slug || '')
}

export function extractPublicSeoReviews(section: unknown): PublicSeoReview[] {
  if (!section || typeof section !== 'object') return []
  const data = section as { items?: unknown[]; data?: { items?: unknown[] } }
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data.data?.items) ? data.data.items : []
  const reviews: PublicSeoReview[] = []

  for (const raw of items) {
    if (!raw || typeof raw !== 'object') continue
    const item = raw as Record<string, unknown>
    const link = item.review_link
    const hasLink = Boolean(link && typeof link === 'object' && (link as { has_link?: boolean }).has_link)
    if (hasLink) continue
    const status = item.status
    if (status === 0 || status === '0' || status === false) continue
    const author = String(item.title || item.author || '').trim()
    const text = stripHtml(String(item.description || item.text || ''))
    if (!author && !text) continue
    const ratingRaw = Number(item.rating)
    reviews.push({
      author: author || 'Customer',
      text,
      rating: Number.isFinite(ratingRaw) ? Math.min(5, Math.max(1, Math.round(ratingRaw))) : 5,
    })
    if (reviews.length >= 10) break
  }

  return reviews
}

function sectionItems(section: unknown): Record<string, unknown>[] {
  if (!section || typeof section !== 'object') return []
  const data = section as { items?: unknown[]; data?: { items?: unknown[] } }
  const items = Array.isArray(data.items) ? data.items : Array.isArray(data.data?.items) ? data.data.items : []
  return items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === 'object')
}

function itemIsHidden(item: Record<string, unknown>): boolean {
  return item.status === 0 || item.status === '0' || item.status === false
}

function firstImageUrl(value: unknown): string {
  if (typeof value === 'string') return value.trim()
  if (Array.isArray(value)) {
    for (const entry of value) {
      if (typeof entry === 'string' && entry.trim()) return entry.trim()
      if (entry && typeof entry === 'object' && typeof (entry as { url?: unknown }).url === 'string') {
        const url = (entry as { url: string }).url.trim()
        if (url) return url
      }
    }
  }
  if (value && typeof value === 'object' && typeof (value as { url?: unknown }).url === 'string') {
    return (value as { url: string }).url.trim()
  }
  return ''
}

export function extractPublicSeoFaqs(section: unknown): PublicSeoFaq[] {
  const faqs: PublicSeoFaq[] = []
  for (const item of sectionItems(section)) {
    if (itemIsHidden(item)) continue
    const question = stripHtml(String(item.title || item.question || ''))
    const answer = stripHtml(String(item.description || item.answer || ''))
    if (!question || !answer) continue
    faqs.push({ question, answer })
    if (faqs.length >= 20) break
  }
  return faqs
}

/** Drop empty / placeholder / test products from Product JSON-LD. */
export function isSchemaEligibleProduct(product: PublicSeoProduct): boolean {
  const name = product.name.trim()
  if (!name) return false
  if (/^test(\s+title)?$/i.test(name)) return false
  if (/^(untitled|n\/?a|placeholder|asdf|xxx+|sample product|test product)$/i.test(name)) return false
  if (!product.description.trim() && !product.price.trim() && !product.image.trim()) return false
  return Boolean(parseProductOffer(product.price))
}

export function extractPublicSeoProducts(section: unknown): PublicSeoProduct[] {
  const products: PublicSeoProduct[] = []
  for (const item of sectionItems(section)) {
    if (itemIsHidden(item)) continue
    const name = stripHtml(String(item.title || item.name || ''))
    if (!name) continue
    const description = stripHtml(String(item.description || ''))
    const price = stripHtml(String(item.offerPrice || item.offer_price || item.price || ''))
    const image = firstImageUrl(item.featured_image || item.image)
    const product = { name, description, price, image }
    if (!isSchemaEligibleProduct(product)) continue
    products.push(product)
    if (products.length >= 20) break
  }
  return products
}

export function extractPublicSeoServices(section: unknown): PublicSeoService[] {
  const services: PublicSeoService[] = []
  for (const item of sectionItems(section)) {
    if (itemIsHidden(item)) continue
    const name = stripHtml(String(item.title || item.name || ''))
    if (!name) continue
    if (/^test(\s+title)?$/i.test(name)) continue
    const description = stripHtml(String(item.description || ''))
    services.push({ name, description })
    if (services.length >= 20) break
  }
  return services
}

export function sectionByName(sections: Record<string, unknown> | null | undefined, names: string[]): unknown {
  if (!sections) return undefined
  const wanted = new Set(names.map((name) => name.toLowerCase()))
  for (const [key, value] of Object.entries(sections)) {
    if (wanted.has(key.toLowerCase())) return value
  }
  return undefined
}

export function isPublicCardIndexable(profile: MyCardProfile): boolean {
  if (profile.is_draft === true) return false
  if (profile.is_public === false) return false
  return true
}

/** A card whose public name is the business name, rather than a person at that business. */
export function publicCardEntityType(profile: MyCardProfile): 'Person' | 'LocalBusiness' {
  const name = profile.name?.trim().toLowerCase() || ''
  const company = profile.company_name?.trim().toLowerCase() || ''
  if (name && company && name === company) return 'LocalBusiness'
  return 'Person'
}

/** Detect "City, ST" (optionally with full state name) stored in the address field. */
function parseCityStateLine(value: string): { locality: string; region: string } | null {
  const trimmed = value.trim()
  if (!trimmed || trimmed.includes('\n')) return null
  const match = trimmed.match(/^([^,]+),\s*([A-Za-z]{2})\b(?:\s*,\s*[A-Za-z\s]+)?$/)
  if (!match) return null
  const locality = match[1].trim()
  const region = match[2].trim().toUpperCase()
  if (!locality || locality.length < 2) return null
  if (/\d/.test(locality)) return null
  return { locality, region }
}

function postalAddress(profile: MyCardProfile) {
  let street = profile.address?.trim() || ''
  let city = profile.city?.trim() || ''
  let region = profile.state?.trim() || ''
  const postalCode = profile.zip_code?.trim() || profile.zipCode?.trim() || ''
  let country = profile.country?.trim() || ''

  const cityStateFromStreet = street ? parseCityStateLine(street) : null
  if (cityStateFromStreet) {
    if (!city) city = cityStateFromStreet.locality
    if (!region) region = cityStateFromStreet.region
    street = ''
  } else if (street && city && region) {
    const normalizedStreet = street.toLowerCase().replace(/\s+/g, ' ')
    const cityRegion = `${city}, ${region}`.toLowerCase()
    if (normalizedStreet === cityRegion || normalizedStreet.startsWith(`${cityRegion},`)) {
      street = ''
    }
  }

  if (!country && (city || region || postalCode)) country = 'US'

  if (!street && !city && !region && !postalCode && !country) return undefined
  return {
    '@type': 'PostalAddress',
    ...(street ? { streetAddress: street } : {}),
    ...(city ? { addressLocality: city } : {}),
    ...(region ? { addressRegion: region } : {}),
    ...(postalCode ? { postalCode } : {}),
    ...(country ? { addressCountry: country } : {}),
  }
}

function serviceOffers(services: PublicSeoService[]): Record<string, unknown>[] {
  return services.map((service) => ({
    '@type': 'Offer',
    itemOffered: {
      '@type': 'Service',
      name: service.name,
      ...(service.description ? { description: service.description } : {}),
    },
  }))
}

function sharedVbizOrganizationNode(): Record<string, unknown> {
  return {
    '@type': 'Organization',
    '@id': VBIZ_ME_ORGANIZATION_ID,
    name: VBIZ_ME_ORGANIZATION_NAME,
    url: VBIZ_ME_ORGANIZATION_URL,
    logo: VBIZ_ME_ORGANIZATION_LOGO,
  }
}

export function buildPublicCardJsonLd(
  input: PublicCardSeoInput,
  extras?: { services?: PublicSeoService[] }
): Record<string, unknown> {
  const { myCard, origin, cardPath, slug } = input
  const profile = myCard.profile
  const seo = resolvePublicCardSeo(myCard, slug)
  const canonical = buildPublicCardCanonicalUrl(origin, cardPath)
  const name = profile.name?.trim() || slug
  const description = seo.metaDescription
  const image = resolvePublicCardImageUrl(myCard, origin, slug)
  const sameAs = collectSameAsUrls(profile)
  const company = profile.company_name?.trim() || ''
  const entityType = publicCardEntityType(profile)
  const personId = `${canonical}#${entityType === 'LocalBusiness' ? 'business' : 'person'}`
  const websiteUrl = profile.website?.trim()
    ? cleanSameAsUrl(profile.website.startsWith('http') ? profile.website : `https://${profile.website}`)
    : ''
  const telephone = profile.phone?.trim() ? toSchemaTelephone(profile.phone) : undefined
  const offers = serviceOffers(extras?.services || [])

  let worksFor: Record<string, unknown> | undefined
  if (entityType === 'Person' && company) {
    if (isVbizMeCompanyName(company)) {
      worksFor = { '@id': VBIZ_ME_ORGANIZATION_ID }
    } else {
      worksFor = {
        '@type': 'Organization',
        '@id': `${canonical}#employer`,
        name: company,
        ...(websiteUrl ? { url: websiteUrl } : {}),
      }
    }
  }

  const person: Record<string, unknown> = {
    '@type': entityType,
    '@id': personId,
    name,
    url: canonical,
    ...(entityType === 'Person' && profile.designation?.trim() ? { jobTitle: profile.designation.trim() } : {}),
    ...(entityType === 'Person' && profile.profession?.trim() && !profile.designation?.trim()
      ? { jobTitle: profile.profession.trim() }
      : {}),
    ...(worksFor ? { worksFor } : {}),
    ...(description ? { description } : {}),
    ...(image && isSchemaHttpUrl(image) ? { image } : {}),
    ...(profile.email?.trim() && isSchemaEmail(profile.email) ? { email: profile.email.trim() } : {}),
    ...(telephone ? { telephone } : {}),
    ...(postalAddress(profile) ? { address: postalAddress(profile) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
    ...(offers.length ? { makesOffer: offers } : {}),
  }

  // Never emit Review / AggregateRating — self-serving review markup violates Google guidelines.

  const keywords = seo.metaKeywords.filter(Boolean)
  const websiteId = `${origin.replace(/\/$/, '')}/#website`

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${canonical}#page`,
    url: canonical,
    name: seo.metaTitle || name,
    description,
    inLanguage: 'en-US',
    isPartOf: { '@id': websiteId },
    breadcrumb: { '@id': `${canonical}#breadcrumb` },
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
    mainEntity: person,
  }
}

/**
 * ProfilePage plus Person/Org, FAQ, services, and products — one script Google can read.
 * Same builder for every published public card slug (no per-card special cases).
 */
export function buildPublicCardJsonLdGraph(
  input: PublicCardSeoInput,
  extras?: { faqs?: PublicSeoFaq[]; products?: PublicSeoProduct[]; services?: PublicSeoService[] }
): Record<string, unknown> {
  const page = buildPublicCardJsonLd(input, { services: extras?.services })
  const pageNode = { ...page }
  delete pageNode['@context']
  const inlineEntity = { ...(pageNode.mainEntity as Record<string, unknown>) }
  const personId = String(inlineEntity['@id'] || `${String(pageNode.url)}#person`)
  pageNode.mainEntity = { '@id': personId }

  const canonical = String(pageNode.url || '')
  const origin = (() => {
    try {
      return new URL(canonical).origin
    } catch {
      return input.origin.replace(/\/$/, '')
    }
  })()
  const websiteId = `${origin}/#website`
  const name = String(inlineEntity.name || input.slug)

  const graph: Record<string, unknown>[] = [
    pageNode,
    inlineEntity,
    sharedVbizOrganizationNode(),
    {
      '@type': 'WebSite',
      '@id': websiteId,
      url: origin,
      name: VBIZ_ME_ORGANIZATION_NAME,
      publisher: { '@id': VBIZ_ME_ORGANIZATION_ID },
    },
    {
      '@type': 'BreadcrumbList',
      '@id': `${canonical}#breadcrumb`,
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: VBIZ_ME_ORGANIZATION_NAME,
          item: VBIZ_ME_ORGANIZATION_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name,
          item: canonical,
        },
      ],
    },
  ]

  const employer = inlineEntity.worksFor as Record<string, unknown> | undefined
  if (
    employer &&
    typeof employer === 'object' &&
    employer['@type'] === 'Organization' &&
    employer['@id'] &&
    employer['@id'] !== VBIZ_ME_ORGANIZATION_ID
  ) {
    graph.push(employer)
    inlineEntity.worksFor = { '@id': employer['@id'] }
  }

  const faqs = extras?.faqs?.filter((item) => item.question && item.answer) ?? []
  if (faqs.length) {
    graph.push({
      '@type': 'FAQPage',
      '@id': `${canonical}#faq`,
      url: canonical,
      mainEntity: faqs.map((faq) => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    })
  }

  const products = (extras?.products || []).filter(isSchemaEligibleProduct)
  let productIndex = 0
  for (const product of products) {
    const offer = parseProductOffer(product.price)
    if (!offer) continue
    productIndex += 1
    const description = [product.description, product.price ? `Price ${product.price}` : ''].filter(Boolean).join('. ')
    const image = origin && product.image ? toAbsoluteUrl(origin, product.image) : product.image
    graph.push({
      '@type': 'Product',
      '@id': `${canonical}#product-${productIndex}`,
      name: product.name,
      url: canonical,
      ...(description ? { description } : {}),
      ...(image && isSchemaHttpUrl(image) ? { image } : {}),
      offers: {
        '@type': 'Offer',
        price: offer.price,
        priceCurrency: offer.priceCurrency,
        url: canonical,
      },
    })
  }

  return {
    '@context': 'https://schema.org',
    '@graph': graph,
  }
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
}

function patchProfilePageNode(
  node: Record<string, unknown>,
  seo: { metaTitle?: string | null; metaDescription?: string | null; metaKeywords?: string[] | null },
  fallbackName?: string | null
): Record<string, unknown> {
  const title = seo.metaTitle?.trim() || fallbackName?.trim() || ''
  const description = seo.metaDescription?.trim() || ''
  const keywords = (seo.metaKeywords || []).map((k) => k.trim()).filter(Boolean)
  const next: Record<string, unknown> = { ...node }

  if (title) next.name = title
  if (description) {
    next.description = description
    const entity = next.mainEntity
    if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
      const entityRecord = entity as Record<string, unknown>
      // Only patch inline Person/LocalBusiness objects — leave @id references alone.
      if (entityRecord['@type'] === 'Person' || entityRecord['@type'] === 'LocalBusiness') {
        next.mainEntity = { ...entityRecord, description }
      }
    }
  }
  if (keywords.length) next.keywords = keywords.join(', ')
  else delete next.keywords

  return next
}

/**
 * Patch ProfilePage JSON-LD so title / description / keywords stay aligned with Card Settings SEO.
 * Supports both a lone ProfilePage object and an @graph document. Never creates a second ProfilePage.
 */
export function applySeoFieldsToJsonLd(
  data: Record<string, unknown>,
  seo: { metaTitle?: string | null; metaDescription?: string | null; metaKeywords?: string[] | null },
  fallbackName?: string | null
): Record<string, unknown> {
  if (Array.isArray(data['@graph'])) {
    const graph = (data['@graph'] as unknown[]).map((node) => {
      if (!node || typeof node !== 'object' || Array.isArray(node)) return node
      const record = node as Record<string, unknown>
      const type = record['@type']
      const id = typeof record['@id'] === 'string' ? record['@id'] : ''
      if (type === 'ProfilePage' || id.endsWith('#page')) {
        return patchProfilePageNode(record, seo, fallbackName)
      }
      if (
        (type === 'Person' || type === 'LocalBusiness') &&
        seo.metaDescription?.trim() &&
        (id.endsWith('#person') || id.endsWith('#business'))
      ) {
        return { ...record, description: seo.metaDescription.trim() }
      }
      return record
    })
    return { ...data, '@graph': graph }
  }

  return patchProfilePageNode(data, seo, fallbackName)
}

export function buildPublicCardSeoMetadata(input: PublicCardSeoInput): Metadata {
  const { myCard, origin, cardPath, slug } = input
  const seo = resolvePublicCardSeo(myCard, slug)
  const name = myCard.profile.name?.trim() || slug
  const title = seo.metaTitle
  const description = seo.metaDescription
  const canonical = buildPublicCardCanonicalUrl(origin, cardPath)
  const image = resolvePublicCardImageUrl(myCard, origin, slug)
  const keywords = seo.metaKeywords.filter(Boolean)
  const indexable = isPublicCardIndexable(myCard.profile)

  return {
    metadataBase: new URL(origin),
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    alternates: {
      canonical,
      types: {
        'text/markdown': `${canonical}/llms.txt`,
      },
    },
    robots: {
      index: indexable,
      follow: indexable,
      googleBot: {
        index: indexable,
        follow: indexable,
        'max-image-preview': 'large',
        'max-snippet': -1,
        'max-video-preview': -1,
      },
    },
    openGraph: {
      type: 'profile',
      title,
      description,
      url: canonical,
      siteName: 'vBiz Me',
      ...(image ? { images: [{ url: image, alt: name }] } : {}),
    },
    twitter: {
      card: image ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(image ? { images: [image] } : {}),
    },
  }
}
