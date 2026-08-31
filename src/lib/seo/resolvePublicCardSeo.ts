import type { MyCardData } from '@/interfaces/api/myCard'
import { isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { isGenericPublicCardImage } from '@/lib/publicCards/publicCardImage'
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

function isUsableShareImage(url: unknown): url is string {
  const value = typeof url === 'string' ? url.trim() : ''
  if (!value || !isUsableImageSrc(value)) return false
  if (isVideoUrl(value) || isGenericPublicCardImage(value)) return false
  return true
}

function pushShareImageCandidate(seen: Set<string>, out: string[], url: unknown) {
  if (!isUsableShareImage(url) || seen.has(url)) return
  seen.add(url)
  out.push(url)
}

/**
 * Ordered still-image candidates for Open Graph / JSON-LD / Twitter cards:
 * 1. Card avatar still (skip video avatar URLs)
 * 2. Profile image fields
 * 3. About Me featured image
 * 4. Remaining logo / my-info icon candidates
 */
export function collectPublicCardShareImageCandidates(card: MyCardData): string[] {
  const settings = card.settings || {}
  const setting = (key: string) => (typeof settings[key] === 'string' ? settings[key].trim() : '')
  const seen = new Set<string>()
  const candidates: string[] = []
  const profileMedia = card.profile_media
  const profileMediaIsVideo =
    profileMedia?.is_video === true || isVideoUrl(profileMedia?.url || '') || isVideoUrl(profileMedia?.video_url || '')

  pushShareImageCandidate(seen, candidates, setting('share_preview_image_url'))

  if (profileMediaIsVideo) {
    pushShareImageCandidate(seen, candidates, profileMedia?.fallback_url)
    pushShareImageCandidate(seen, candidates, setting('about_me_featured_media_url'))
  } else {
    pushShareImageCandidate(seen, candidates, profileMedia?.url)
    pushShareImageCandidate(seen, candidates, profileMedia?.fallback_url)
  }

  pushShareImageCandidate(seen, candidates, setting('profile_media_url'))
  pushShareImageCandidate(seen, candidates, setting('profile_image'))
  pushShareImageCandidate(seen, candidates, setting('profile_image_url'))
  pushShareImageCandidate(seen, candidates, card.profile?.avatar)

  if (!profileMediaIsVideo) {
    pushShareImageCandidate(seen, candidates, setting('about_me_featured_media_url'))
  }

  for (const group of ['personal', 'professional', 'contact'] as const) {
    const fields = card.my_info?.[group]
    if (!fields) continue
    for (const field of Object.values(fields)) {
      pushShareImageCandidate(seen, candidates, field?.icon)
    }
  }

  for (const url of resolvePwaAvatarCandidates(card)) {
    pushShareImageCandidate(seen, candidates, url)
  }

  return candidates
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

/** Share-preview image: avatar still, profile image, About Me image, then generated PWA icon. */
export function resolvePublicCardShareImageUrl(myCard: MyCardData, origin: string, slug: string): string {
  for (const candidate of collectPublicCardShareImageCandidates(myCard)) {
    const absolute = toAbsoluteUrl(origin, candidate)
    if (absolute) return absolute
  }

  const trimmedSlug = slug.trim() || myCard.profile.slug?.trim() || ''
  if (!trimmedSlug) return ''
  return `${origin.replace(/\/$/, '')}${buildPwaIconUrl(origin, trimmedSlug, 512)}`
}
