/** Matches legacy public About featured media crop (upper-biased). */
export const DEFAULT_ABOUT_FEATURED_MEDIA_FOCUS_Y = 22

export function parseFeaturedMediaFocusY(
  value: unknown,
  fallback: number = DEFAULT_ABOUT_FEATURED_MEDIA_FOCUS_Y
): number {
  if (value === null || value === undefined || value === '') return fallback
  const n = typeof value === 'number' ? value : Number(String(value).trim())
  if (!Number.isFinite(n)) return fallback
  return Math.min(100, Math.max(0, Math.round(n)))
}

export function featuredMediaObjectPosition(focusY: number): string {
  return `center ${focusY}%`
}

export function resolveFeaturedMediaFocusY(stored: number | null | undefined): number {
  if (stored === null || stored === undefined) return DEFAULT_ABOUT_FEATURED_MEDIA_FOCUS_Y
  return parseFeaturedMediaFocusY(stored)
}
