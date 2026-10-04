import { buildProfileShareUrl } from '../profilePublicProps'

export type ShareProfileInput = {
  shareSlug?: string
  title: string
  text?: string
}

export function resolveShareUrl(shareSlug?: string): string {
  if (shareSlug?.trim()) return buildProfileShareUrl(shareSlug)
  if (typeof window !== 'undefined') {
    // Drop hash/query so Facebook/LinkedIn get a clean public card URL.
    return window.location.href.split('#')[0].split('?')[0]
  }
  return 'https://vbiz.me'
}

export type ShareProfileResult = 'shared' | 'copied' | 'cancelled' | 'failed'

function isIosDevice(): boolean {
  if (typeof navigator === 'undefined') return false
  return (
    /iPad|iPhone|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  )
}

/** Absolute https URL for share targets (Facebook drops relative / empty `u=`). */
export function toAbsoluteShareUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^https?:\/\//i.test(trimmed)) return trimmed.split('#')[0].split('?')[0]
  if (typeof window === 'undefined') return trimmed
  try {
    return new URL(trimmed, window.location.origin).href.split('#')[0].split('?')[0]
  } catch {
    return trimmed
  }
}

export function buildFacebookShareHref(shareUrl: string, shareText = '', options?: { mobile?: boolean }): string {
  const url = toAbsoluteShareUrl(shareUrl)
  const quote = [shareText.trim(), url].filter(Boolean).join(' ')
  // Put the link in both `u` and `quote` — iOS Facebook app often drops `u`.
  const params = new URLSearchParams()
  params.set('u', url)
  if (quote) params.set('quote', quote)
  // Mobile sharer keeps the link more reliably when the Facebook app intercepts desktop sharer.php.
  const host = options?.mobile ? 'https://m.facebook.com/sharer.php' : 'https://www.facebook.com/sharer/sharer.php'
  return `${host}?${params.toString()}`
}

function openFacebookShareHref(href: string): void {
  if (typeof window === 'undefined' || !href) return
  // After an await, iOS often blocks window.open — location.assign still works.
  if (isIosDevice()) {
    try {
      window.location.assign(href)
      return
    } catch {
      /* fall through */
    }
  }
  openShareWindow(href)
}

/**
 * Open a share / external https URL from a real tap.
 * Prefer a synchronous window.open; fall back to a programmatic <a> click (iOS Safari).
 */
export function openShareWindow(href: string): boolean {
  if (typeof window === 'undefined' || !href) return false

  try {
    const opened = window.open(href, '_blank', 'noopener,noreferrer')
    if (opened) return true
  } catch {
    /* try anchor fallback */
  }

  try {
    const anchor = document.createElement('a')
    anchor.href = href
    anchor.target = '_blank'
    anchor.rel = 'noopener noreferrer'
    anchor.style.display = 'none'
    document.body.appendChild(anchor)
    anchor.click()
    document.body.removeChild(anchor)
    return true
  } catch {
    try {
      window.location.assign(href)
      return true
    } catch {
      return false
    }
  }
}

/**
 * Facebook share (esp. iPhone):
 * Do not route through navigator.share — choosing Facebook from the iOS sheet
 * often opens an empty composer (no URL, no friend suggestions).
 * Open Facebook's sharer in the same tap so `u` + `quote` carry the card link.
 */
export async function shareToFacebook(shareUrl: string, shareText: string, _title?: string): Promise<void> {
  const url = toAbsoluteShareUrl(shareUrl)
  if (!url) return

  const facebookHref = buildFacebookShareHref(url, shareText, { mobile: isIosDevice() })

  if (isIosDevice()) {
    openFacebookShareHref(facebookHref)
    return
  }

  if (!openShareWindow(facebookHref) && typeof window !== 'undefined') {
    window.location.assign(facebookHref)
  }
}

export type InstagramShareResult = 'copied_opened' | 'opened_only' | 'failed'

/**
 * Instagram has no public “share this URL” web intent.
 * Smart flow: copy the card link (+ message), then open Instagram so the user can paste
 * into a Story, Reel caption, DM, or post.
 */
export async function shareToInstagram(shareUrl: string, shareText = ''): Promise<InstagramShareResult> {
  const url = toAbsoluteShareUrl(shareUrl)
  if (!url) return 'failed'

  const payload = [shareText.trim(), url].filter(Boolean).join(' ')
  let copied = false
  try {
    await navigator.clipboard.writeText(payload)
    copied = true
  } catch {
    copied = false
  }

  const opened = openShareWindow('https://www.instagram.com/')
  if (copied && opened) return 'copied_opened'
  if (opened) return 'opened_only'
  if (copied) return 'copied_opened'
  return 'failed'
}

/** Opens the OS native share sheet when available; otherwise copies the profile URL. */
export async function shareProfile(input: ShareProfileInput): Promise<ShareProfileResult> {
  const url = resolveShareUrl(input.shareSlug)
  const title = input.title
  const text = input.text ?? `Check out ${title}'s digital business card`

  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
