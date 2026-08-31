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
    if (!value || seen.has(value.toLowerCase())) return
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

function postalAddress(profile: MyCardProfile) {
  const extra = profile as MyCardProfile & {
    city?: string | null
    state?: string | null
    zipcode?: string | null
  }
  const street = extra.address?.trim() || ''
  const city = extra.city?.trim() || ''
  const region = extra.state?.trim() || ''
  const postalCode = extra.zipcode?.trim() || ''
  const country = extra.country?.trim() || ''
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
  const personId = `${canonical}#person`

  const person: Record<string, unknown> = {
    '@type': 'Person',
    '@id': personId,
    name,
    url: canonical,
    ...(profile.designation?.trim() ? { jobTitle: profile.designation.trim() } : {}),
    ...(profile.profession?.trim() && !profile.designation?.trim() ? { jobTitle: profile.profession.trim() } : {}),
    ...(company ? { worksFor: { '@type': 'Organization', name: company } } : {}),
    ...(description ? { description } : {}),
    ...(image ? { image } : {}),
    ...(profile.email?.trim() ? { email: profile.email.trim() } : {}),
    ...(profile.phone?.trim() ? { telephone: profile.phone.trim() } : {}),
    ...(postalAddress(profile) ? { address: postalAddress(profile) } : {}),
    ...(sameAs.length ? { sameAs } : {}),
  }

  if (reviews.length) {
    const ratingValues = reviews.map((review) => review.rating)
    const ratingValue =
      Math.round((ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length) * 10) / 10
    person.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue,
      reviewCount: reviews.length,
      bestRating: 5,
      worstRating: 1,
    }
    person.review = reviews.map((review) => ({
      '@type': 'Review',
      author: { '@type': 'Person', name: review.author },
      ...(review.text ? { reviewBody: review.text } : {}),
      reviewRating: {
        '@type': 'Rating',
        ratingValue: review.rating,
        bestRating: 5,
        worstRating: 1,
      },
    }))
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${canonical}#page`,
    url: canonical,
    name: seo.metaTitle || name,
    description,
    mainEntity: person,
  }
}

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c')
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

  return {
    metadataBase: new URL(origin),
    title,
    description,
    keywords: keywords.length ? keywords : undefined,
    alternates: { canonical },
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
