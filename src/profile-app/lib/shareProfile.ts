import { buildProfileShareUrl } from '../profilePublicProps'

export type ShareProfileInput = {
  shareSlug?: string
  title: string
  text?: string
}

export type ShareCopyInput = {
  metaTitle?: string | null
  metaDescription?: string | null
  /** Visible card name used when SEO fields are empty. */
  fallbackName?: string | null
}

/**
 * Share sheet / social intent copy — prefer Card Settings SEO meta title & description
 * so WhatsApp, Facebook quote, X, SMS, and native share match the public SEO tags.
 */
export function buildShareCopy(input: ShareCopyInput): { title: string; text: string; message: string } {
  const name = input.fallbackName?.trim() || 'this'
  const title = input.metaTitle?.trim() || (name === 'this' ? 'Digital business card' : name)
  const text =
    input.metaDescription?.trim() ||
    `Check out ${name === 'this' ? 'this' : `${name}'s`} digital business card profile here:`
  // Single-field apps (WhatsApp / SMS) get title + description together.
  const message = title && text && title !== text ? `${title}\n${text}` : text || title
  return { title, text, message }
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
  // Put the link in both `u` and `quote` — Facebook often drops a bare `u`.
  const params = new URLSearchParams()
  params.set('u', url)
  if (quote) params.set('quote', quote)
  const host = options?.mobile ? 'https://m.facebook.com/sharer.php' : 'https://www.facebook.com/sharer/sharer.php'
  return `${host}?${params.toString()}`
}

/** Message body for iOS share sheet — URL must live in `text` (see shareToFacebook). */
export function buildFacebookShareText(shareUrl: string, shareText = ''): string {
  const url = toAbsoluteShareUrl(shareUrl)
  // Trailing space helps iOS keep the full link when handing off to apps.
  return [shareText.trim(), url].filter(Boolean).join('\n') + (url ? ' ' : '')
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

export type FacebookShareResult = 'shared' | 'opened' | 'cancelled' | 'failed'

/**
 * Facebook share button — go straight to Meta’s create-post / sharer with the card URL.
 *
 * Do NOT use navigator.share() for this button on iPhone: the iOS sheet shows
 * Messages / contact rows (“message users”), not Facebook’s composer. Android
 * already works via sharer.php; iPhone uses the same sharer, with location.assign
 * so Safari keeps the tap gesture and can hand off to the Facebook app.
 * Clipboard is primed so the user can paste if Facebook still drops `u=`.
 */
export async function shareToFacebook(
  shareUrl: string,
  shareText: string,
  _title?: string
): Promise<FacebookShareResult> {
  const url = toAbsoluteShareUrl(shareUrl)
  if (!url) return 'failed'

  const facebookHref = buildFacebookShareHref(url, shareText, { mobile: isIosDevice() })

  // Never await clipboard before navigation — that can burn the iOS user-gesture token.
  void navigator.clipboard?.writeText(url).catch(() => undefined)

  if (typeof window === 'undefined') return 'failed'

  // iPhone/iPad: same-tab navigation is the reliable path into Facebook’s composer
  // (popups are often blocked; navigator.share opens Messages contacts instead).
  if (isIosDevice()) {
    try {
      window.location.assign(facebookHref)
      return 'opened'
    } catch {
      /* fall through */
    }
  }

  if (openShareWindow(facebookHref)) return 'opened'

  try {
    window.location.assign(facebookHref)
    return 'opened'
  } catch {
    return 'failed'
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
