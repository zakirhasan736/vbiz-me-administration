import { captureClientMetadata, type ContactSaveMetadata } from '@/lib/contactSaves'
import { getCurrentUserRole, notifyOwnerAndAdmin, notifyOwners, pushNotification } from '@/lib/notifications'

export type GuestMessageRecord = {
  id: string
  fullName: string
  email: string
  phoneNumber?: string
  guestMessage: string
  submittedAt: string
  vCardId: string
  vCardSlug: string
  vCardName: string
  ownerId: string
  ownerName: string
  kind: 'guest_message'
  privateNotes?: string
  lastReply?: string
  lastReplyAt?: string
  metadata: ContactSaveMetadata
}

const STORAGE_KEY = 'vbiz_guest_messages'
const LEGACY_SEED_PREFIX = 'seed_gmsg_'
export const GUEST_MESSAGES_EVENT = 'vbiz_guest_messages_update'

export function loadGuestMessages(): GuestMessageRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return removeLegacySeedGuestMessages(parsed as GuestMessageRecord[])
  } catch {
    return []
  }
}

function removeLegacySeedGuestMessages(list: GuestMessageRecord[]): GuestMessageRecord[] {
  const filtered = list.filter((record) => !record.id?.startsWith(LEGACY_SEED_PREFIX))
  if (filtered.length === list.length || typeof window === 'undefined') return filtered

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 300)))
  } catch {
    /* ignore */
  }

  return filtered
}

function persist(list: GuestMessageRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 300)))
  window.dispatchEvent(new Event(GUEST_MESSAGES_EVENT))
}

export function createGuestMessage(input: {
  fullName: string
  email?: string
  phoneNumber?: string
  guestMessage: string
  vCardId: string
  vCardSlug: string
  vCardName: string
  ownerId: string
  ownerName: string
}): GuestMessageRecord {
  const record: GuestMessageRecord = {
    id: `gmsg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName: input.fullName,
    email: input.email || '',
    phoneNumber: input.phoneNumber || '',
    guestMessage: input.guestMessage,
    submittedAt: new Date().toISOString(),
    vCardId: input.vCardId,
    vCardSlug: input.vCardSlug,
    vCardName: input.vCardName,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    kind: 'guest_message',
    privateNotes: '',
    metadata: captureClientMetadata(),
  }

  const list = loadGuestMessages()
  list.unshift(record)
  persist(list)

  const ownerAudience = input.vCardId === input.ownerId ? 'single' : 'corporate'
  notifyOwnerAndAdmin({
    ownerAudience,
    category: 'message',
    ownerTitle: 'New guest note (no contact save)',
    ownerBody: `${input.fullName}: ${input.guestMessage.slice(0, 100)}`,
    adminTitle: 'Guest note without contact save',
    adminBody: `${input.fullName} left a note on ${input.vCardName}.`,
    ownerHref: '/',
    adminHref: '/admin/leads',
  })

  return record
}

export function updateGuestMessageNotes(id: string, privateNotes: string) {
  const list = loadGuestMessages()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) return false
  list[idx] = { ...list[idx], privateNotes }
  persist(list)
  if (getCurrentUserRole() === 'admin') {
    notifyOwners({
      category: 'note',
      title: 'Admin note reply',
      body: `Admin updated a note on guest message from ${list[idx].fullName}: ${privateNotes.slice(0, 80)}`,
      forceBrowser: true,
    })
  }
  return true
}

export function updateGuestMessageReply(id: string, replyText: string) {
  const list = loadGuestMessages()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) return false
  list[idx] = {
    ...list[idx],
    lastReply: replyText,
    lastReplyAt: new Date().toISOString(),
  }
  persist(list)
  if (getCurrentUserRole() === 'admin') {
    notifyOwners({
      category: 'reply',
      title: 'Admin message reply',
      body: `Admin replied to guest note from ${list[idx].fullName}: ${replyText.slice(0, 80)}`,
      forceBrowser: true,
    })
  } else {
    pushNotification({
      audience: list[idx].vCardId === list[idx].ownerId ? 'single' : 'corporate',
      category: 'reply',
      title: 'Reply sent to guest note',
      body: `Reply to ${list[idx].fullName}: ${replyText.slice(0, 80)}`,
      href: '/',
    })
  }
  return true
}

export function getGuestMessagesForOwner(
  ownerId?: string | null,
  role: 'single' | 'corporate' | 'admin' = 'single',
  vCardIdFilter?: string | null
) {
  if (!ownerId && role !== 'admin') return []
  let list = loadGuestMessages()
  if (role === 'admin') {
    /* all */
  } else if (role === 'single') {
    list = list.filter((r) => r.ownerId === ownerId && r.vCardId === ownerId)
  } else {
    list = list.filter((r) => r.ownerId === ownerId)
  }
  if (vCardIdFilter) list = list.filter((r) => r.vCardId === vCardIdFilter)
  return list
}
