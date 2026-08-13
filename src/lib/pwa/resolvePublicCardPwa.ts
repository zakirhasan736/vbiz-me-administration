import type { MyCardData } from '@interfaces/api/myCard'

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

function cardPath(slug: string): string {
  return `/v/${encodeURIComponent(slug.trim())}`
}

/** Document URL — must match the public card page so Chrome treats it as in-scope. */
export function buildPublicCardStartUrl(_origin: string, slug: string): string {
  return cardPath(slug)
}

export function buildPwaIconUrl(_origin: string, slug: string, size: 192 | 512): string {
  return `${cardPath(slug)}/icon/${size}`
}

/** In-scope manifest. Chrome hides Install if the manifest lives outside `scope`. */
export function buildPwaManifestUrl(slug: string): string {
  return `${cardPath(slug)}/manifest.webmanifest`
}

export type PublicCardPwaMeta = {
  slug: string
  name: string
  shortName: string
  avatarUrl: string | null
  themeColor: string
  backgroundColor: string
}

export function resolvePublicCardPwaMeta(card: MyCardData | null | undefined, slug: string): PublicCardPwaMeta {
  const name = resolvePwaDisplayName(card?.profile?.name, slug)
  return {
    slug: slug.trim(),
    name,
    shortName: resolvePwaShortName(card?.profile?.name, slug),
    avatarUrl: card ? resolvePwaAvatarUrl(card) : null,
    themeColor: '#0b0f19',
    backgroundColor: '#0b0f19',
  }
}

export function buildPublicCardManifest(card: MyCardData | null | undefined, slug: string) {
  const trimmed = slug.trim()
  const path = cardPath(trimmed)
  const meta = resolvePublicCardPwaMeta(card, trimmed)
  const icon192 = `${path}/icon/192`
  const icon512 = `${path}/icon/512`

  return {
    id: path,
    name: meta.name,
    short_name: meta.shortName,
    description: `${meta.name}'s digital business card`,
    start_url: path,
    scope: path,
    display: 'standalone',
    orientation: 'any',
    background_color: meta.backgroundColor,
    theme_color: meta.themeColor,
    icons: [
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: icon192, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
      { src: icon512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}

export function manifestJsonResponse(manifest: ReturnType<typeof buildPublicCardManifest>): Response {
  return new Response(JSON.stringify(manifest), {
    status: 200,
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=300',
    },
  })
}
