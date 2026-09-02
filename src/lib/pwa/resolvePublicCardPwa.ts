import { buildProfileIconPath, buildProfileManifestPath, buildProfilePath } from '@/lib/profileRoutes'
import type { MyCardData } from '@interfaces/api/myCard'

function ownerDisplayName(card: MyCardData | null | undefined): string {
  return card?.profile?.name?.trim() || card?.profile?.company_name?.trim() || ''
}

/** Home-screen label; OS truncates long names. */
export function resolvePwaShortName(fullName: string | null | undefined, slug: string): string {
  const name = fullName?.trim() || slug.trim() || 'vCard'
  return name.slice(0, 20)
}

export function resolvePwaDisplayName(fullName: string | null | undefined, slug: string): string {
  const name = fullName?.trim()
  if (name) return name.slice(0, 45)
  return slug.trim() || 'Digital Card'
}

function myInfoIcon(card: MyCardData, groups: Array<'professional' | 'personal'>, keys: string[]): string {
  for (const group of groups) {
    const fields = card.my_info?.[group]
    if (!fields) continue
    for (const key of keys) {
      const icon = fields[key]?.icon?.trim()
      if (icon) return icon
    }
  }
  return ''
}

function isPwaVideoUrl(url: string): boolean {
  return /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url) || url.includes('/backgroundVideos/')
}

function isUsablePwaImageUrl(url: string): boolean {
  const value = url.trim()
  if (!value) return false
  if (isPwaVideoUrl(value)) return false
  return /^https?:\/\//i.test(value) || value.startsWith('/')
}

/** All still-image candidates: profile photo, company logo, featured image. */
export function resolvePwaAvatarCandidates(card: MyCardData): string[] {
  const settings = card.settings || {}
  const setting = (key: string) => (typeof settings[key] === 'string' ? settings[key].trim() : '')
  const raw = [
    setting('profile_media_url'),
    card.profile_media?.url?.trim() || '',
    card.profile_media?.fallback_url?.trim() || '',
    setting('company_logo'),
    setting('company_icon_url'),
    card.profile?.avatar?.trim() || '',
    setting('featured_image'),
    setting('featured_image_url'),
    setting('profile_image'),
    setting('profile_image_url'),
    myInfoIcon(card, ['professional', 'personal'], ['company_name', 'company', 'company_office']),
  ]

  const seen = new Set<string>()
  const candidates: string[] = []
  for (const url of raw) {
    if (!isUsablePwaImageUrl(url) || seen.has(url)) continue
    seen.add(url)
    candidates.push(url)
  }
  return candidates
}

/** Prefer still image avatar; skip obvious video URLs for PWA icons. */
export function resolvePwaAvatarUrl(card: MyCardData): string | null {
  return resolvePwaAvatarCandidates(card)[0] || null
}

/** Document URL — must match the public card page so Chrome treats it as in-scope. */
export function buildPublicCardStartUrl(_origin: string, slug: string): string {
  return buildProfilePath(slug)
}

export function buildPwaIconUrl(_origin: string, slug: string, size: 192 | 512): string {
  return buildProfileIconPath(slug, size)
}

/** In-scope manifest. Chrome hides Install if the manifest lives outside `scope`. */
export function buildPwaManifestUrl(slug: string): string {
  return buildProfileManifestPath(slug)
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
  const ownerName = ownerDisplayName(card)
  const name = resolvePwaDisplayName(ownerName, slug)
  return {
    slug: slug.trim(),
    name,
    shortName: resolvePwaShortName(ownerName || name, slug),
    avatarUrl: card ? resolvePwaAvatarUrl(card) : null,
    themeColor: '#0b0f19',
    backgroundColor: '#0b0f19',
  }
}

export function buildPublicCardManifest(card: MyCardData | null | undefined, slug: string) {
  const trimmed = slug.trim()
  const path = buildProfilePath(trimmed)
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
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    prefer_related_applications: false,
    background_color: meta.backgroundColor,
    theme_color: meta.themeColor,
    categories: ['business', 'productivity', 'social'],
    launch_handler: {
      client_mode: ['navigate-existing', 'auto'],
    },
    shortcuts: [
      {
        name: 'Save Contact',
        short_name: 'Contact',
        description: `Save ${meta.shortName}'s contact details`,
        url: `${path}?action=contact`,
        icons: [{ src: icon192, sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Share Card',
        short_name: 'Share',
        description: `Share ${meta.shortName}'s digital card`,
        url: `${path}?action=share`,
        icons: [{ src: icon192, sizes: '192x192', type: 'image/png' }],
      },
      {
        name: 'Notifications',
        short_name: 'Alerts',
        description: `Follow updates from ${meta.shortName}`,
        url: `${path}?action=notifications`,
        icons: [{ src: icon192, sizes: '192x192', type: 'image/png' }],
      },
    ],
    share_target: {
      action: path,
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    },
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
