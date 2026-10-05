import { VBIZ_DEFAULT_FAVICON_PATH } from '@/components/brand/VbizBrandMark'
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
 * Ordered still-image candidates for Open Graph / JSON-LD / Twitter / browser-tab icons:
 * 1. Card Settings → SEO image
 * 2. Avatar / profile still
 * 3. Profile image fields
 * 4. About Me featured image
 * 5. Remaining logo / my-info icon candidates
 */
export function collectPublicCardShareImageCandidates(card: MyCardData): string[] {
  const settings = card.settings || {}
  const setting = (key: string) => (typeof settings[key] === 'string' ? settings[key].trim() : '')
  const seen = new Set<string>()
  const candidates: string[] = []
  const profileMedia = card.profile_media
  const profileMediaIsVideo =
    profileMedia?.is_video === true || isVideoUrl(profileMedia?.url || '') || isVideoUrl(profileMedia?.video_url || '')

  pushShareImageCandidate(seen, candidates, setting('seo_image_url'))
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

function tidyTitleSeparators(title: string): string {
  return title
    .replace(/\s*\|\s*/g, ' | ')
    .replace(/\s+/g, ' ')
    .trim()
}

function includesPhrase(haystack: string, phrase: string): boolean {
  const needle = phrase.trim().toLowerCase()
  if (!needle) return false
  return haystack.toLowerCase().includes(needle)
}

/** Keep the person or business name, then the saved title, then a location if it still fits. */
export function composePublicCardTitle(input: {
  name: string
  company: string
  role: string
  city: string
  state: string
  custom: string
}): string {
  const name = input.name.trim()
  const company = input.company.trim()
  const role = input.role.trim()
  const city = input.city.trim()
  const state = input.state.trim()
  const custom = tidyTitleSeparators(input.custom)
  const sameNameAndCompany = Boolean(name && company && name.toLowerCase() === company.toLowerCase())
  const pieces: string[] = []

  if (name && !includesPhrase(custom, name)) pieces.push(name)
  if (custom) pieces.push(custom)
  else if (role) pieces.push(role)
  else if (company && !sameNameAndCompany) pieces.push(company)

  if (!pieces.length) pieces.push(name || company || 'Digital Card')

  const place = [city, state].filter(Boolean).join(', ')
  const alreadyHasPlace =
    (city && includesPhrase(pieces.join(' '), city)) || (state && includesPhrase(pieces.join(' '), state))
  if (place && !alreadyHasPlace) pieces.push(place)

  let title = ''
  for (const piece of pieces) {
    const next = tidyTitleSeparators(title ? `${title} | ${piece}` : piece)
    if (next.length > 70) break
    title = next
  }
  return title || tidyTitleSeparators(pieces[0] || 'Digital Card').slice(0, 70)
}

/** Effective SEO for share previews — custom settings first, then profile-derived defaults. */
export function resolvePublicCardSeo(myCard: MyCardData, slug: string): VCardSeo {
  const parsed = parseSeoSettings(myCard.settings || {})
  const profile = myCard.profile
  const name = profile.name?.trim() || slug.trim() || 'Digital Card'
  const company = profile.company_name?.trim() || ''
  const role = profile.designation?.trim() || profile.profession?.trim() || ''
  const city = profile.city?.trim() || ''
  const state = profile.state?.trim() || ''
  const about = stripHtml(String(profile.description || ''))

  const metaTitle = composePublicCardTitle({
    name,
    company,
    role,
    city,
    state,
    custom: parsed.metaTitle,
  })

  const place = [city, state].filter(Boolean).join(', ')
  let metaDescription =
    parsed.metaDescription ||
    about ||
    (role && company
      ? `${role} at ${company}. Connect with ${name}.`
      : role
        ? `${role}. Connect with ${name}.`
        : `${name}'s digital business card on vBiz Me.`)
  if (place && !includesPhrase(metaDescription, city || state)) {
    const withPlace = `${metaDescription.replace(/[.\s]+$/, '')}. Based in ${place}.`
    if (withPlace.length <= 160) metaDescription = withPlace
  }

  const ownerKeywords = ownerSeoKeywords(parsed.metaKeywords)
  const metaKeywords = normalizeSeoKeywords(
    ownerKeywords.length > 0 ? [...ownerKeywords, name, company, role] : [name, company, role]
  )

  return normalizeCardSeo({
    metaTitle,
    metaDescription,
    metaKeywords,
    seoImage: parsed.seoImage,
    faviconUrl: parsed.faviconUrl,
  })
}

/** Browser-tab favicon: Card Settings favicon → vBiz Me brand icon (never Next.js default). */
export function resolvePublicCardFaviconUrl(myCard: MyCardData | null | undefined, origin: string): string {
  const settings = myCard?.settings || {}
  const custom = typeof settings.seo_favicon_url === 'string' ? settings.seo_favicon_url.trim() : ''
  if (custom && isUsableShareImage(custom)) {
    return toAbsoluteUrl(origin, custom)
  }
  return toAbsoluteUrl(origin, VBIZ_DEFAULT_FAVICON_PATH)
}

/** Share-preview image: SEO image → avatar → profile → About Me → generated PWA icon. */
export function resolvePublicCardShareImageUrl(myCard: MyCardData, origin: string, slug: string): string {
  for (const candidate of collectPublicCardShareImageCandidates(myCard)) {
    const absolute = toAbsoluteUrl(origin, candidate)
    if (absolute) return absolute
  }

  const trimmedSlug = slug.trim() || myCard.profile.slug?.trim() || ''
  if (!trimmedSlug) return ''
  return `${origin.replace(/\/$/, '')}${buildPwaIconUrl(origin, trimmedSlug, 512)}`
}
