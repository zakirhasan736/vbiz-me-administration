import type { PublicCard } from '@interfaces/api/publicCards'

const GENERIC_IMAGE_MARKERS = [
  '/website/images/logo.png',
  'website/images/logo',
  'default-avatar',
  'default_avatar',
  'placeholder',
  'no-image',
  'no_image',
  'vbizme.mp4',
  'mc%20vbizme',
]

export function isGenericPublicCardImage(url: string | null | undefined): boolean {
  const trimmed = url?.trim()
  if (!trimmed) return true
  const lower = trimmed.toLowerCase()
  return GENERIC_IMAGE_MARKERS.some((marker) => lower.includes(marker))
}

export function initialsFromPublicCardName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase()
}

/** Encode path segments so filenames with spaces load in Next/Image and <img>. */
export function normalizePublicCardImageUrl(url: string): string {
  try {
    const parsed = new URL(url)
    parsed.pathname = parsed.pathname
      .split('/')
      .map((segment, index) => (index === 0 ? segment : encodeURIComponent(decodeURIComponent(segment))))
      .join('/')
    return parsed.href
  } catch {
    return url
  }
}

/** Use `image` from GET /public-cards as-is when it is a real profile file (not logo.png). */
export function resolvePublicCardImage(card: PublicCard): { src: string | null; isVideo: boolean } {
  const image = card.image?.trim() ?? ''
  if (!image || isGenericPublicCardImage(image)) {
    return { src: null, isVideo: false }
  }

  const src = normalizePublicCardImageUrl(image)
  if (card.is_video || card.image_type?.toLowerCase() === 'video') {
    return { src, isVideo: true }
  }
  return { src, isVideo: false }
}

type PublicCardMediaSortable = {
  img: string | null
  isVideo: boolean
}

function publicCardMediaSortRank(card: PublicCardMediaSortable): number {
  if (card.img && card.isVideo) return 0
  if (card.img) return 1
  return 2
}

/** Videos first, then photos, then initials-only cards. */
export function sortPublicCardsByMediaPriority<T extends PublicCardMediaSortable>(cards: T[]): T[] {
  return [...cards].sort((a, b) => publicCardMediaSortRank(a) - publicCardMediaSortRank(b))
}
