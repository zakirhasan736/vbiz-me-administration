import adminActivityApi from '@/redux/features/adminActivity/adminActivity.api'
import { store } from '@/redux/store'
import type { AuditType, CreateAuditLogPayload } from '@/types/activity'
import type { VCardData } from '@/types/vcard'
import { pushNotification } from './notifications'

type MockCard = VCardData & { id?: string; ownerId?: string }

const MOCK_CARDS_KEY = 'vbiz_mock_vcards'
const MOCK_CLICKS_KEY = 'vbiz_mock_link_clicks'

export type MockUser = {
  uid: string
  email?: string | null
  displayName?: string | null
  emailVerified?: boolean
}

export function getMockUser(): MockUser | null {
  try {
    const raw = localStorage.getItem('vbiz_mock_user')
    if (!raw) return null
    return JSON.parse(raw) as MockUser
  } catch {
    return null
  }
}

export function isMockMode(): boolean {
  return !!getMockUser()
}

export function loadMockCards(): MockCard[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(MOCK_CARDS_KEY)
    if (!raw) return []
    return JSON.parse(raw) as VCardData[]
  } catch {
    return []
  }
}

export function saveMockCards(cards: MockCard[]) {
  localStorage.setItem(MOCK_CARDS_KEY, JSON.stringify(cards))
  window.dispatchEvent(new Event('vbiz_mock_cards_update'))
}

export function upsertMockCard(card: MockCard) {
  const cards = loadMockCards()
  const idx = cards.findIndex((c) => c.id === card.id)
  const isNew = idx < 0
  if (idx >= 0) cards[idx] = card
  else cards.push(card)
  saveMockCards(cards)
  if (isNew) {
    const name = card.personal?.fullName || 'Untitled card'
    const isSingleOwnerCard = !!card.ownerId && card.id === card.ownerId
    pushNotification({
      audience: 'admin',
      category: 'card_created',
      title: isSingleOwnerCard ? 'New single card created' : 'New corporate card created',
      body: `${name} was added to the directory.`,
      href: '/admin/vcards',
    })
  }
  return cards
}

export function deleteMockCard(id: string) {
  const cards = loadMockCards().filter((c) => c.id !== id)
  saveMockCards(cards)
  return cards
}

export function getMockLinkClicks(vCardId: string) {
  try {
    const raw = localStorage.getItem(MOCK_CLICKS_KEY)
    const all = raw ? JSON.parse(raw) : {}
    return (all[vCardId] || []) as { label: string; url: string; clickCount: number }[]
  } catch {
    return []
  }
}

/** All card → link click rows (live mock store only) */
export function getAllMockLinkClicksMap(): Record<string, { label: string; url: string; clickCount: number }[]> {
  try {
    const raw = localStorage.getItem(MOCK_CLICKS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

export function trackMockLinkClick(vCardId: string, url: string, label: string) {
  const raw = localStorage.getItem(MOCK_CLICKS_KEY)
  const all = raw ? JSON.parse(raw) : {}
  const list: { label: string; url: string; clickCount: number }[] = all[vCardId] || []
  const existing = list.find((x) => x.label === label)
  if (existing) existing.clickCount += 1
  else list.push({ label, url, clickCount: 1 })
  all[vCardId] = list
  localStorage.setItem(MOCK_CLICKS_KEY, JSON.stringify(all))
}

function normalizeAuditType(type?: string): AuditType {
  const t = (type || 'update').toLowerCase()
  if (
    t === 'create' ||
    t === 'update' ||
    t === 'delete' ||
    t === 'schedule' ||
    t === 'cancel' ||
    t === 'status' ||
    t === 'settings' ||
    t === 'view' ||
    t === 'save' ||
    t === 'click'
  ) {
    return t
  }
  if (t.includes('delete') || t.includes('cancel')) return 'delete'
  if (t.includes('schedule')) return 'schedule'
  if (t.includes('create') || t.includes('user_create')) return 'create'
  if (t.includes('status')) return 'status'
  if (
    t.includes('settings') ||
    t.includes('quota') ||
    t.includes('package') ||
    t.includes('announcement') ||
    t.includes('notice')
  ) {
    return 'settings'
  }
  return 'update'
}

export function appendAuditLog(entry: {
  action: string
  details: string
  type?: string
  actor?: string
  profileId?: string | null
}) {
  const payload: CreateAuditLogPayload = {
    action: entry.action,
    details: entry.details,
    type: normalizeAuditType(entry.type),
    actor: entry.actor || 'You',
    profileId: entry.profileId ?? null,
  }

  void store.dispatch(adminActivityApi.endpoints.createAuditLog.initiate(payload))
}
