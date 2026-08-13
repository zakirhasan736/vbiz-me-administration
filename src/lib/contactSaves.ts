import { getCurrentUserRole, notifyOwnerAndAdmin, notifyOwners, pushNotification } from './notifications'

export type ContactSaveMetadata = {
  userAgent: string
  language: string
  platform: string
  browser: string
  device: string
  screen: string
  timezone: string
  approximateLocation: string
  referrer: string
}

export type ContactSaveRecord = {
  id: string
  fullName: string
  phoneNumber: string
  email: string
  consent: boolean
  submittedAt: string
  vCardId: string
  vCardSlug: string
  vCardName: string
  ownerId: string
  ownerName: string
  /** Optional note the guest wrote when saving contact */
  guestMessage?: string
  privateNotes?: string
  lastReply?: string
  lastReplyAt?: string
  metadata: ContactSaveMetadata
}

const STORAGE_KEY = 'vbiz_contact_saves'
const LEGACY_SEED_PREFIX = 'seed_'
export const CONTACT_SAVES_EVENT = 'vbiz_contact_saves_update'

function parseBrowser(ua: string): string {
  if (/Edg\//.test(ua)) return 'Microsoft Edge'
  if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) return 'Chrome'
  if (/Firefox\//.test(ua)) return 'Firefox'
  if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) return 'Safari'
  return 'Unknown browser'
}

function parseDevice(ua: string): string {
  if (/iPhone|iPad|iPod/.test(ua)) return 'iOS'
  if (/Android/.test(ua)) return 'Android'
  if (/Windows/.test(ua)) return 'Windows'
  if (/Macintosh|Mac OS X/.test(ua)) return 'macOS'
  if (/Linux/.test(ua)) return 'Linux'
  return 'Unknown device'
}

export function captureClientMetadata(): ContactSaveMetadata {
  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : ''
  return {
    userAgent: ua,
    language: typeof navigator !== 'undefined' ? navigator.language : 'en',
    platform:
      typeof navigator !== 'undefined' ? (navigator as Navigator & { platform?: string }).platform || 'web' : 'web',
    browser: parseBrowser(ua),
    device: parseDevice(ua),
    screen: typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    approximateLocation: 'Approx. from browser locale/timezone',
    referrer: typeof document !== 'undefined' ? document.referrer || 'Direct / QR' : 'Direct',
  }
}

export function loadContactSaves(): ContactSaveRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return removeLegacySeedContactSaves(parsed as ContactSaveRecord[])
  } catch {
    return []
  }
}

function removeLegacySeedContactSaves(list: ContactSaveRecord[]): ContactSaveRecord[] {
  const filtered = list.filter((record) => !record.id?.startsWith(LEGACY_SEED_PREFIX))
  if (filtered.length === list.length || typeof window === 'undefined') return filtered

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered))
  } catch {
    /* ignore */
  }

  return filtered
}

export function saveContactSaves(list: ContactSaveRecord[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  window.dispatchEvent(new Event(CONTACT_SAVES_EVENT))
}

export function upsertContactSave(record: ContactSaveRecord) {
  const list = loadContactSaves()
  const idx = list.findIndex((r) => r.id === record.id)
  if (idx >= 0) list[idx] = record
  else list.unshift(record)
  saveContactSaves(list)
  return record
}

export function deleteContactSave(id: string) {
  saveContactSaves(loadContactSaves().filter((r) => r.id !== id))
}

export function updateContactSaveNotes(id: string, privateNotes: string) {
  const list = loadContactSaves()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) return false
  list[idx] = { ...list[idx], privateNotes }
  saveContactSaves(list)
  const ownerAudience = list[idx].vCardId === list[idx].ownerId ? 'single' : 'corporate'
  const role = getCurrentUserRole()
  if (role === 'admin') {
    notifyOwners({
      category: 'note',
      title: 'Admin note reply',
      body: `Admin updated a note on lead ${list[idx].fullName}: ${privateNotes.slice(0, 80)}`,
      forceBrowser: true,
    })
  } else {
    pushNotification({
      audience: ownerAudience,
      category: 'note',
      title: 'Private note saved',
      body: `Note updated for ${list[idx].fullName}.`,
      href: '/',
    })
  }
  return true
}

export function updateContactSaveReply(id: string, replyText: string) {
  const list = loadContactSaves()
  const idx = list.findIndex((r) => r.id === id)
  if (idx < 0) return false
  list[idx] = {
    ...list[idx],
    lastReply: replyText,
    lastReplyAt: new Date().toISOString(),
  }
  saveContactSaves(list)
  const ownerAudience = list[idx].vCardId === list[idx].ownerId ? 'single' : 'corporate'
  const role = getCurrentUserRole()
  if (role === 'admin') {
    notifyOwners({
      category: 'reply',
      title: 'Admin message reply',
      body: `Admin replied on lead ${list[idx].fullName}: ${replyText.slice(0, 80)}`,
      forceBrowser: true,
    })
  } else {
    pushNotification({
      audience: ownerAudience,
      category: 'reply',
      title: 'Urgent reply sent',
      body: `Reply to ${list[idx].fullName}: ${replyText.slice(0, 80)}`,
      href: '/',
    })
    pushNotification({
      audience: 'admin',
      category: 'message',
      title: 'Owner sent a lead reply',
      body: `${list[idx].ownerName || 'Owner'} replied to ${list[idx].fullName}.`,
      href: '#leads',
    })
  }
  return true
}

export function getContactSavesForOwner(
  ownerId?: string | null,
  role: 'single' | 'corporate' | 'admin' = 'single',
  vCardIdFilter?: string | null
) {
  if (!ownerId && role !== 'admin') return []
  const all = loadContactSaves()
  let list =
    role === 'admin'
      ? all
      : role === 'single'
        ? all.filter((r) => r.ownerId === ownerId && r.vCardId === ownerId)
        : all.filter((r) => r.ownerId === ownerId)

  if (vCardIdFilter) {
    list = list.filter((r) => r.vCardId === vCardIdFilter)
  }
  return list
}

export function createContactSave(input: {
  fullName: string
  phoneNumber: string
  email: string
  consent?: boolean
  guestMessage?: string
  vCardId: string
  vCardSlug: string
  vCardName: string
  ownerId: string
  ownerName: string
}): ContactSaveRecord {
  const record: ContactSaveRecord = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    fullName: input.fullName,
    phoneNumber: input.phoneNumber,
    email: input.email,
    consent: input.consent ?? true,
    submittedAt: new Date().toISOString(),
    vCardId: input.vCardId,
    vCardSlug: input.vCardSlug,
    vCardName: input.vCardName,
    ownerId: input.ownerId,
    ownerName: input.ownerName,
    guestMessage: input.guestMessage?.trim() || '',
    privateNotes: '',
    metadata: captureClientMetadata(),
  }
  upsertContactSave(record)
  const ownerAudience = input.vCardId === input.ownerId ? 'single' : 'corporate'
  notifyOwnerAndAdmin({
    ownerAudience,
    category: 'contact_save',
    ownerTitle: 'New contact saved',
    ownerBody: `${input.fullName} shared details on ${input.vCardName}.`,
    adminTitle: 'New contact save',
    adminBody: `${input.fullName} saved on ${input.vCardName} (${ownerAudience}).`,
    ownerHref: '/',
    adminHref: '#leads',
  })
  return record
}
