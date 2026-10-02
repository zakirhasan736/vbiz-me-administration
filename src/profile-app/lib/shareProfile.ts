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

export function buildFacebookShareHref(shareUrl: string, shareText = ''): string {
  const url = toAbsoluteShareUrl(shareUrl)
  const quote = [shareText.trim(), url].filter(Boolean).join(' ')
  // Put the link in both `u` and `quote` — iOS Facebook app sometimes drops `u`.
  const params = new URLSearchParams()
  params.set('u', url)
  if (quote) params.set('quote', quote)
  return `https://www.facebook.com/sharer/sharer.php?${params.toString()}`
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
 * Facebook on iOS often opens the app without the card URL when using sharer.php.
 * Prefer the native share sheet (URL is included); fall back to sharer with quote.
 */
export async function shareToFacebook(shareUrl: string, shareText: string, title?: string): Promise<void> {
  const url = toAbsoluteShareUrl(shareUrl)
  if (!url) return

  if (isIosDevice() && typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: title || 'Digital business card',
        text: shareText || undefined,
        url,
      })
      return
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') return
      // Fall through to sharer.php
    }
  }

  openShareWindow(buildFacebookShareHref(url, shareText))
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
