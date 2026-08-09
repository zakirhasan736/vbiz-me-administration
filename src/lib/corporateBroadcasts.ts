export type CorporateBroadcast = {
  id: string
  text: string
  type: 'broadcast' | 'system'
  audience: 'all' | 'savers'
  targetCardId?: string
  recipientCount?: number
  createdAt: string
}

const STORAGE_KEY = 'vbiz_corporate_broadcasts'

export function loadCorporateBroadcasts(): CorporateBroadcast[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? (parsed as CorporateBroadcast[]) : []
  } catch {
    return []
  }
}

export function saveCorporateBroadcasts(messages: CorporateBroadcast[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  window.dispatchEvent(new Event('corporate_broadcasts_change'))
}

export function addCorporateBroadcast(
  input: Omit<CorporateBroadcast, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
): CorporateBroadcast {
  const next: CorporateBroadcast = {
    id: input.id || `bc_${Date.now()}`,
    createdAt: input.createdAt || new Date().toISOString(),
    text: input.text,
    type: input.type,
    audience: input.audience,
    targetCardId: input.targetCardId,
    recipientCount: input.recipientCount,
  }
  const list = [next, ...loadCorporateBroadcasts()]
  saveCorporateBroadcasts(list)
  return next
}

export function deleteCorporateBroadcast(id: string) {
  saveCorporateBroadcasts(loadCorporateBroadcasts().filter((m) => m.id !== id))
}
