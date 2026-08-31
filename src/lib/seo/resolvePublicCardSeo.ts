import type { MyCardData } from '@/interfaces/api/myCard'
import { buildPwaIconUrl, resolvePwaAvatarCandidates } from '@/lib/pwa/resolvePublicCardPwa'
import { normalizeCardSeo, normalizeSeoKeywords, ownerSeoKeywords, parseSeoSettings } from '@/lib/seo/cardSeo'
import type { VCardSeo } from '@/types/vcard'

function toAbsoluteUrl(origin: string, value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  if (trimmed.startsWith('//')) return `https:${trimmed}`
  if (trimmed.startsWith('/')) return `${origin.replace(/\/$/, '')}${trimmed}`
  return trimmed
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Effective SEO for share previews — custom settings first, then profile-derived defaults. */
export function resolvePublicCardSeo(myCard: MyCardData, slug: string): VCardSeo {
  const parsed = parseSeoSettings(myCard.settings || {})
  const profile = myCard.profile
  const name = profile.name?.trim() || slug.trim() || 'Digital Card'
  const company = profile.company_name?.trim() || ''
  const role = profile.designation?.trim() || profile.profession?.trim() || ''
  const about = stripHtml(String(profile.description || ''))

  const metaTitle =
    parsed.metaTitle || (company && role ? `${name} | ${role}` : company ? `${name} | ${company}` : name)

  const metaDescription =
    parsed.metaDescription ||
    about ||
    (role && company
      ? `${role} at ${company}. Connect with ${name}.`
      : role
        ? `${role}. Connect with ${name}.`
        : `${name}'s digital business card on vBiz Me.`)

  const ownerKeywords = ownerSeoKeywords(parsed.metaKeywords)
  const metaKeywords = normalizeSeoKeywords(
    ownerKeywords.length > 0 ? [...ownerKeywords, name, company, role] : [name, company, role]
  )

  return normalizeCardSeo({ metaTitle, metaDescription, metaKeywords })
}

/** Share-preview image: profile still, then generated PWA icon on the public card origin. */
export function resolvePublicCardShareImageUrl(myCard: MyCardData, origin: string, slug: string): string {
  for (const candidate of resolvePwaAvatarCandidates(myCard)) {
    const absolute = toAbsoluteUrl(origin, candidate)
    if (absolute) return absolute
  }

  const trimmedSlug = slug.trim() || myCard.profile.slug?.trim() || ''
  if (!trimmedSlug) return ''
  return `${origin.replace(/\/$/, '')}${buildPwaIconUrl(origin, trimmedSlug, 512)}`
}
