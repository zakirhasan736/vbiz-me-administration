export const NEW_CARD_HIGHLIGHT_MS = 24 * 60 * 60 * 1000

export function isNewCardHighlight(createdAt?: string | null): boolean {
  if (!createdAt) return false
  const at = Date.parse(createdAt)
  if (!Number.isFinite(at)) return false
  const age = Date.now() - at
  return age >= 0 && age < NEW_CARD_HIGHLIGHT_MS
}

export type NewCardHighlightLabel = 'new' | 'duplicated'

export function newCardHighlightLabel(duplicatedFrom?: string | null): NewCardHighlightLabel {
  return duplicatedFrom?.trim() ? 'duplicated' : 'new'
}
