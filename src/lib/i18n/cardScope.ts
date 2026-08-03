/** Per-card scope for translation & live-agent language context. */

let scopedCardOwnerId: string | null = null

export function setTranslationCardScope(cardOwnerId: string | null) {
  scopedCardOwnerId = cardOwnerId?.trim() || null
}

export function getTranslationCardScope(): string | null {
  return scopedCardOwnerId
}

export function resolveCardOwnerId(fallback = 'michaelangelo_casanova'): string {
  if (scopedCardOwnerId) return scopedCardOwnerId

  if (typeof window === 'undefined') return fallback

  const pathMatch = window.location.pathname.match(/^\/([^/]+)/)
  if (pathMatch?.[1]) return decodeURIComponent(pathMatch[1])

  const params = new URLSearchParams(window.location.search)
  return params.get('id') || params.get('card') || params.get('cardId') || fallback
}
