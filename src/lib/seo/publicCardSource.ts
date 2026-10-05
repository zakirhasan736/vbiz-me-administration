import type { MyCardData } from '@/interfaces/api/myCard'
import { buildProfilePath } from '@/lib/profileRoutes'
import {
  buildPublicCardCanonicalUrl,
  extractPublicSeoFaqs,
  extractPublicSeoProducts,
  extractPublicSeoReviews,
  sectionByName,
  type PublicSeoFaq,
  type PublicSeoProduct,
  type PublicSeoReview,
} from '@/lib/seo/publicCardSeo'

export function plainCardText(value: unknown): string {
  return String(value ?? '')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

const STRUCTURED_SECTION_KEYS = new Set(['faq', 'faqs', 'reviews', 'review', 'products', 'see products', 'product'])
const SOURCE_LINE_LIMIT = 80

function sectionLines(sections: Record<string, unknown> | null | undefined): string[] {
  const lines: string[] = []
  if (!sections) return lines
  for (const [key, section] of Object.entries(sections)) {
    if (STRUCTURED_SECTION_KEYS.has(key.toLowerCase())) continue
    if (!section || typeof section !== 'object') continue
    const items = (section as { items?: unknown[] }).items
    if (!Array.isArray(items)) continue
    for (const item of items) {
      if (!item || typeof item !== 'object') continue
      const row = item as { title?: unknown; description?: unknown; status?: unknown }
      if (row.status === 0 || row.status === '0' || row.status === false) continue
      const title = plainCardText(row.title)
      const description = plainCardText(row.description)
      if (title) lines.push(title)
      if (description && description !== title) lines.push(description)
      if (lines.length >= SOURCE_LINE_LIMIT) return lines
    }
  }
  return lines
}

export type PublicCardSource = {
  name: string
  companyLine: string
  about: string
  address: string
  phone: string
  email: string
  website: string
  lines: string[]
  faqs: PublicSeoFaq[]
  reviews: PublicSeoReview[]
  products: PublicSeoProduct[]
  canonical: string
  markdownUrl: string
}

export function assemblePublicCardSource(input: {
  slug: string
  origin: string
  myCard: MyCardData
  sections?: Record<string, unknown> | null
}): PublicCardSource {
  const profile = input.myCard.profile
  const name = plainCardText(profile.name) || input.slug
  const role = plainCardText(profile.designation) || plainCardText(profile.profession)
  const company = plainCardText(profile.company_name)
  const street = plainCardText(profile.address)
  const city = plainCardText(profile.city)
  const state = plainCardText(profile.state)
  const postal = plainCardText(profile.zip_code || profile.zipCode)
  const address = [street, city, state, postal]
    .filter((part, index, all) => {
      if (!part) return false
      const earlier = all.slice(0, index).join(' ').toLowerCase()
      return !earlier.includes(part.toLowerCase())
    })
    .join(', ')
  const canonical = buildPublicCardCanonicalUrl(input.origin, buildProfilePath(input.slug))
  const companyLine =
    company && company.toLowerCase() !== name.toLowerCase() ? (role ? `${role} at ${company}` : company) : role

  return {
    name,
    companyLine,
    about: plainCardText(profile.description),
    address,
    phone: plainCardText(profile.phone),
    email: plainCardText(profile.email),
    website: plainCardText(profile.website),
    lines: sectionLines(input.sections),
    faqs: extractPublicSeoFaqs(sectionByName(input.sections, ['faqs', 'faq', 'Faq'])),
    reviews: extractPublicSeoReviews(sectionByName(input.sections, ['reviews', 'review'])),
    products: extractPublicSeoProducts(sectionByName(input.sections, ['products', 'See Products', 'product'])),
    canonical,
    markdownUrl: `${canonical}/llms.txt`,
  }
}
