import { buildProfileShareUrl } from '../profilePublicProps'

export type ShareProfileInput = {
  shareSlug?: string
  title: string
  text?: string
}

export function resolveShareUrl(shareSlug?: string): string {
  if (shareSlug?.trim()) return buildProfileShareUrl(shareSlug)
  if (typeof window !== 'undefined') return window.location.href
  return 'https://vbiz.me'
}

export type ShareProfileResult = 'shared' | 'copied' | 'cancelled' | 'failed'

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
