import type { MyCardData } from '@interfaces/api/myCard'

const FALLBACK_ICON = '/favicon.ico'

/** First name-ish label for home-screen (OS truncates long names). */
export function resolvePwaShortName(fullName: string | null | undefined, slug: string): string {
  const name = fullName?.trim() || slug.trim() || 'vCard'
  const first = name.split(/\s+/)[0] || name
  return first.slice(0, 12)
}

export function resolvePwaDisplayName(fullName: string | null | undefined, slug: string): string {
  const name = fullName?.trim()
  if (name) return name.slice(0, 45)
  return slug.trim() || 'Digital Card'
}

/** Prefer still image avatar; skip obvious video URLs for PWA icons. */
export function resolvePwaAvatarUrl(card: MyCardData): string | null {
  const settingsProfile =
    typeof card.settings?.profile_media_url === 'string' ? card.settings.profile_media_url.trim() : ''
  const candidates = [
    settingsProfile,
    card.profile_media?.url?.trim() || '',
    card.profile_media?.fallback_url?.trim() || '',
  ].filter(Boolean)

  for (const url of candidates) {
    if (/\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes('/backgroundVideos/')) continue
    if (/^https?:\/\//i.test(url) || url.startsWith('/')) return url
  }
  return null
}

export function buildPublicCardStartUrl(origin: string, slug: string): string {
  const base = origin.replace(/\/$/, '')
  return `${base}/v/${encodeURIComponent(slug.trim())}?source=pwa`
}

export function buildPwaIconUrl(origin: string, slug: string, size: 192 | 512): string {
  const base = origin.replace(/\/$/, '')
  return `${base}/api/pwa/icon/${encodeURIComponent(slug.trim())}?size=${size}`
}

export function buildPwaManifestUrl(slug: string): string {
  return `/api/pwa/manifest/${encodeURIComponent(slug.trim())}`
}

export function pwaFallbackIconPath(): string {
  return FALLBACK_ICON
}

export type PublicCardPwaMeta = {
  slug: string
  name: string
  shortName: string
  avatarUrl: string | null
  themeColor: string
  backgroundColor: string
}

export function resolvePublicCardPwaMeta(card: MyCardData, slug: string): PublicCardPwaMeta {
  const name = resolvePwaDisplayName(card.profile?.name, slug)
  return {
    slug: slug.trim(),
    name,
    shortName: resolvePwaShortName(card.profile?.name, slug),
    avatarUrl: resolvePwaAvatarUrl(card),
    themeColor: '#0b0f19',
    backgroundColor: '#0b0f19',
  }
}
