export const CORPORATE_CARD_ORDER_KEY = 'corporateCardOrder'
export const ADMIN_CARD_ORDER_KEY = 'adminCardOrder'

export function loadCardOrder(key: string): string[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === 'string') : []
  } catch {
    return []
  }
}

export function saveCardOrder(key: string, ids: string[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(key, JSON.stringify(ids))
  window.dispatchEvent(new Event('card_order_change'))
}

export function applyCardOrder<T extends { id: string }>(items: T[], order: string[]): T[] {
  if (!order.length) return items
  const rank = new Map(order.map((id, index) => [id, index]))
  return [...items].sort((a, b) => {
    const ai = rank.has(a.id) ? rank.get(a.id)! : Number.MAX_SAFE_INTEGER
    const bi = rank.has(b.id) ? rank.get(b.id)! : Number.MAX_SAFE_INTEGER
    if (ai !== bi) return ai - bi
    return 0
  })
}

export function sortByCardOrder<T extends { id?: string }>(cards: T[], order: string[]): T[] {
  if (!order.length) return cards
  const copy = [...cards]
  return copy.sort((a, b) => {
    const idxA = order.indexOf(a.id || '')
    const idxB = order.indexOf(b.id || '')
    const posA = idxA === -1 ? 9999 : idxA
    const posB = idxB === -1 ? 9999 : idxB
    return posA - posB
  })
}

export function reorderByIndex<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length || fromIndex === toIndex) {
    return list
  }
  const next = [...list]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}
