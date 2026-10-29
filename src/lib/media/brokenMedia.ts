/**
 * Public-card fallback for media that fails to load (missing S3 object → 403
 * AccessDenied, 404, network). Visitors never see a broken-image icon or AWS XML:
 * images are swapped for a neutral placeholder, videos are hidden.
 */

export const BROKEN_MEDIA_ATTR = 'data-media-broken'

/** Neutral picture placeholder (light gray card with a simple image glyph). */
export const BROKEN_IMAGE_PLACEHOLDER =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 100" preserveAspectRatio="xMidYMid slice">' +
      '<rect width="160" height="100" fill="#eef0f3"/>' +
      '<g fill="none" stroke="#b8bec8" stroke-width="3" stroke-linejoin="round">' +
      '<rect x="58" y="32" width="44" height="36" rx="4"/>' +
      '<path d="M62 64l12-12 9 9 6-6 9 9"/></g>' +
      '<circle cx="90" cy="42" r="3.5" fill="#b8bec8"/></svg>'
  )

type MediaElement = HTMLImageElement | HTMLVideoElement | HTMLSourceElement

/** True when the element is a media element we should guard (not our own placeholder). */
export function isGuardableMedia(el: EventTarget | null): el is MediaElement {
  if (!el || typeof (el as Element).tagName !== 'string') return false
  const tag = (el as Element).tagName.toLowerCase()
  if (tag !== 'img' && tag !== 'video' && tag !== 'source') return false
  const node = el as MediaElement
  if (node.getAttribute(BROKEN_MEDIA_ATTR)) return false
  if (tag === 'img' && (node as HTMLImageElement).src.startsWith('data:image/svg+xml')) return false
  return true
}

/** Apply the fallback to one failed element. Idempotent. */
export function applyBrokenMediaFallback(el: MediaElement): void {
  const tag = el.tagName.toLowerCase()
  if (tag === 'img') {
    const img = el as HTMLImageElement
    img.setAttribute(BROKEN_MEDIA_ATTR, '1')
    img.removeAttribute('srcset')
    img.removeAttribute('sizes')
    img.src = BROKEN_IMAGE_PLACEHOLDER
    img.style.objectFit = 'cover'
    img.alt = img.alt || ''
    return
  }
  const video = (tag === 'source' ? el.parentElement : el) as HTMLVideoElement | null
  if (!video || video.tagName.toLowerCase() !== 'video') return
  video.setAttribute(BROKEN_MEDIA_ATTR, '1')
  video.pause?.()
  if (video.poster) {
    // Keep the poster frame visible but stop trying to play the missing file.
    video.removeAttribute('src')
    video.removeAttribute('autoplay')
    video.controls = false
  } else {
    video.style.display = 'none'
  }
}

/** Images that already failed before the guard was attached (SSR + slow hydration). */
export function findAlreadyBrokenImages(root: ParentNode): HTMLImageElement[] {
  return Array.from(root.querySelectorAll('img')).filter(
    (img) => img.complete && img.naturalWidth === 0 && Boolean(img.currentSrc || img.src) && isGuardableMedia(img)
  )
}
