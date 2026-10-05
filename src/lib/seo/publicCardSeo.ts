import type { MyCardData, MyCardProfile } from '@/interfaces/api/myCard'
import { resolvePublicCardSeo, resolvePublicCardShareImageUrl } from '@/lib/seo/resolvePublicCardSeo'
import { socialHandleUrl } from '@/lib/vcardSocial'
import type { Metadata } from 'next'

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
  'whatsapp',
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

export function collectSameAsUrls(profile: MyCardProfile): string[] {
  const urls: string[] = []
  const seen = new Set<string>()
  const push = (raw: string) => {
    const value = raw.trim()
    if (!isSchemaHttpUrl(value) || seen.has(value.toLowerCase())) return
    seen.add(value.toLowerCase())
    urls.push(value)
  }

  for (const key of SOCIAL_PROFILE_KEYS) {
    const handle = profile[key]
    if (!handle?.trim()) continue
    const href = socialHandleUrl(key, handle)
    if (href) push(href)
  }

  const website = profile.website?.trim()
  if (website) {
    push(website.startsWith('http') ? website : `https://${website}`)
  }

  return urls
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

export function extractPublicSeoProducts(section: unknown): PublicSeoProduct[] {
  const products: PublicSeoProduct[] = []
  for (const item of sectionItems(section)) {
    if (itemIsHidden(item)) continue
    const name = stripHtml(String(item.title || item.name || ''))
    if (!name) continue
    const description = stripHtml(String(item.description || ''))
    const price = stripHtml(String(item.offerPrice || item.offer_price || item.price || ''))
    const image = firstImageUrl(item.featured_image || item.image)
    products.push({ name, description, price, image })
    if (products.length >= 20) break
  }
  return products
}

export function sectionByName(sections: Record<string, unknown> | null | undefined, names: string[]): unknown {
  if (!sections) return undefined
  const wanted = new Set(names.map((name) => name.toLowerCase()))
  for (const [key, value] of Object.entries(sections)) {
    if (wanted.has(key.toLowerCase())) return value
  }
  return undefined
}

function reviewsForJsonLd(input: PublicCardSeoInput['reviews']): PublicSeoReview[] {
  if (!input) return []
  if (Array.isArray(input)) return input.slice(0, 10)
  return input.slides
    .filter((item) => !item.isLinkCard)
    .slice(0, 10)
    .map((item) => ({
      author: String(item.title || '').trim() || 'Customer',
      text: String(item.plainDescription || ''),
      rating: Number.isFinite(Number(item.rating)) ? Math.min(5, Math.max(1, Math.round(Number(item.rating)))) : 5,
    }))
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

function postalAddress(profile: MyCardProfile) {
  const street = profile.address?.trim() || ''
  const city = profile.city?.trim() || ''
  const region = profile.state?.trim() || ''
  const postalCode = profile.zip_code?.trim() || profile.zipCode?.trim() || ''
  const country = profile.country?.trim() || ''
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

export function buildPublicCardJsonLd(input: PublicCardSeoInput): Record<string, unknown> {
  const { myCard, origin, cardPath, slug } = input
  const profile = myCard.profile
  const seo = resolvePublicCardSeo(myCard, slug)
  const canonical = buildPublicCardCanonicalUrl(origin, cardPath)
  const name = profile.name?.trim() || slug
  const description = seo.metaDescription
  const image = resolvePublicCardImageUrl(myCard, origin, slug)
  const sameAs = collectSameAsUrls(profile)
  const reviews = reviewsForJsonLd(input.reviews)
  const company = profile.company_name?.trim() || ''
  const entityType = publicCardEntityType(profile)
  const personId = `${canonical}#${entityType === 'LocalBusiness' ? 'business' : 'person'}`

  const person: Record<string, unknown> = {
    '@type': entityType,
    '@id': personId,
    name,
    url: canonical,
    ...(entityType === 'Person' && profile.designation?.trim() ? { jobTitle: profile.designation.trim() } : {}),
    ...(entityType === 'Person' && profile.profession?.trim() && !profile.designation?.trim()
      ? { jobTitle: profile.profession.trim() }
      : {}),
    ...(entityType === 'Person' && company ? { worksFor: { '@type': 'Organization', name: company } } : {}),
    ...(description ? { description } : {}),
    ...(image && isSchemaHttpUrl(image) ? { image } : {}),
    ...(profile.email?.trim() && isSchemaEmail(profile.email) ? { email: profile.email.trim() } : {}),
    ...(profile.phone?.trim() ? { telephone: profile.phone.trim() } : {}),
    ...(postalAddress(profile) ? { address: postalAddress(profile) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }

  const reviewMarkup = reviews.length ? reviewMarkupFor(reviews, personId) : null
  // LocalBusiness accepts review and aggregateRating. Person does not, so those sit on ProfilePage.
  if (reviewMarkup && entityType === 'LocalBusiness') {
    person.aggregateRating = reviewMarkup.aggregateRating
    person.review = reviewMarkup.review
  }

  const keywords = seo.metaKeywords.filter(Boolean)

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${canonical}#page`,
    url: canonical,
    name: seo.metaTitle || name,
    description,
    ...(keywords.length ? { keywords: keywords.join(', ') } : {}),
    ...(reviewMarkup && entityType === 'Person' ? reviewMarkup : {}),
    mainEntity: person,
  }
}

function reviewMarkupFor(reviews: PublicSeoReview[], reviewedId: string) {
  const ratingValue = Math.round((reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length) * 10) / 10
  return {
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    },
    review: reviews.map((review) => ({
      '@type': 'Review',
      itemReviewed: { '@id': reviewedId },
      author: { '@type': 'Person', name: review.author },
      ...(review.text ? { reviewBody: review.text } : {}),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    })),
  }
}

/** ProfilePage plus FAQ and products, in one script Google can read. */
export function buildPublicCardJsonLdGraph(
  input: PublicCardSeoInput,
  extras?: { faqs?: PublicSeoFaq[]; products?: PublicSeoProduct[] }
): Record<string, unknown> {
  const page = buildPublicCardJsonLd(input)
  const pageNode = { ...page }
  delete pageNode['@context']
  const canonical = String(pageNode.url || '')
  const graph: Record<string, unknown>[] = [pageNode]
  const faqs = extras?.faqs?.filter((item) => item.question && item.answer) ?? []
  const products = extras?.products?.filter((item) => item.name) ?? []

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

  const origin = (() => {
    try {
      return new URL(canonical).origin
    } catch {
      return ''
    }
  })()
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

/**
 * Patch ProfilePage JSON-LD so title / description / keywords stay aligned with Card Settings SEO.
 * Person `name` is left alone (real person/brand name); only the page + person description update.
 */
export function applySeoFieldsToJsonLd(
  data: Record<string, unknown>,
  seo: { metaTitle?: string | null; metaDescription?: string | null; metaKeywords?: string[] | null },
  fallbackName?: string | null
): Record<string, unknown> {
  const title = seo.metaTitle?.trim() || fallbackName?.trim() || ''
  const description = seo.metaDescription?.trim() || ''
  const keywords = (seo.metaKeywords || []).map((k) => k.trim()).filter(Boolean)
  const next: Record<string, unknown> = { ...data }

  if (title) next.name = title
  if (description) {
    next.description = description
    const entity = next.mainEntity
    if (entity && typeof entity === 'object' && !Array.isArray(entity)) {
      next.mainEntity = { ...(entity as Record<string, unknown>), description }
    }
  }
  if (keywords.length) next.keywords = keywords.join(', ')
  else delete next.keywords

  return next
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
