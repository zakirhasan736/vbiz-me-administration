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
    return JSON.parse(raw) as ContactSaveRecord[]
  } catch {
    return []
  }
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
  const all = ensureSeededContactSaves(ownerId)
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

function seedForOwner(ownerId: string): ContactSaveRecord[] {
  const now = Date.now()
  return [
    {
      id: `seed_${ownerId}_1`,
      fullName: 'Ayesha Rahman',
      phoneNumber: '+880 1711-223344',
      email: 'ayesha.rahman@example.com',
      consent: true,
      submittedAt: new Date(now - 1000 * 60 * 45).toISOString(),
      vCardId: ownerId,
      vCardSlug: 'zakir-consultant',
      vCardName: 'Zakir Hosen',
      ownerId,
      ownerName: 'Zakir Hosen',
      guestMessage: 'Hi Zakir — I’d like a quote for consulting next month. Please reply here.',
      privateNotes: '',
      metadata: {
        userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
        language: 'en-BD',
        platform: 'iPhone',
        browser: 'Safari',
        device: 'iOS',
        screen: '390x844',
        timezone: 'Asia/Dhaka',
        approximateLocation: 'Dhaka, BD (approx.)',
        referrer: 'QR Scan',
      },
    },
    {
      id: `seed_${ownerId}_2`,
      fullName: 'Michael Chen',
      phoneNumber: '+1 (415) 555-0198',
      email: 'm.chen@northwind.io',
      consent: true,
      submittedAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
      vCardId: ownerId,
      vCardSlug: 'zakir-consultant',
      vCardName: 'Zakir Hosen',
      ownerId,
      ownerName: 'Zakir Hosen',
      guestMessage: 'Saw your card at the meetup. Interested in partnership options.',
      privateNotes: '',
      metadata: {
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/122.0.0.0',
        language: 'en-US',
        platform: 'Win32',
        browser: 'Chrome',
        device: 'Windows',
        screen: '1920x1080',
        timezone: 'America/Los_Angeles',
        approximateLocation: 'San Francisco Bay Area (approx.)',
        referrer: 'https://linkedin.com',
      },
    },
    {
      id: `seed_${ownerId}_3`,
      fullName: 'Priya Nair',
      phoneNumber: '+91 98765 43210',
      email: 'priya.nair@gmail.com',
      consent: true,
      submittedAt: new Date(now - 1000 * 60 * 60 * 26).toISOString(),
      vCardId: `${ownerId}_mock_1`,
      vCardSlug: 'sophia-martinez',
      vCardName: 'Sophia Martinez',
      ownerId,
      ownerName: 'Zakir Hosen',
      privateNotes: '',
      metadata: {
        userAgent: 'Mozilla/5.0 (Linux; Android 14) Chrome/121.0.0.0 Mobile',
        language: 'en-IN',
        platform: 'Linux armv8l',
        browser: 'Chrome',
        device: 'Android',
        screen: '412x915',
        timezone: 'Asia/Kolkata',
        approximateLocation: 'Bengaluru, IN (approx.)',
        referrer: 'Direct / QR',
      },
    },
  ]
}

/** Seed demo contact saves once per owner so dashboards aren't empty */
export function ensureSeededContactSaves(ownerId?: string | null): ContactSaveRecord[] {
  const existing = loadContactSaves()
  if (!ownerId) return existing
  const hasOwnerSeed = existing.some((r) => r.ownerId === ownerId)
  if (!hasOwnerSeed) {
    const seeded = [...seedForOwner(ownerId), ...existing]
    saveContactSaves(seeded)
    return seeded
  }
  // Backfill demo guest notes on older seed rows (so owners can see visitor notes)
  let changed = false
  const patched = existing.map((r) => {
    if (r.id === `seed_${ownerId}_1` && !r.guestMessage) {
      changed = true
      return {
        ...r,
        guestMessage: 'Hi Zakir — I’d like a quote for consulting next month. Please reply here.',
      }
    }
    if (r.id === `seed_${ownerId}_2` && !r.guestMessage) {
      changed = true
      return {
        ...r,
        guestMessage: 'Saw your card at the meetup. Interested in partnership options.',
      }
    }
    return r
  })
  if (changed) saveContactSaves(patched)
  return changed ? patched : existing
}
