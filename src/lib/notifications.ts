export type NotificationAudience = 'single' | 'corporate' | 'admin'

export type NotificationCategory =
  | 'contact_save'
  | 'note'
  | 'reply'
  | 'weekly_insight'
  | 'call'
  | 'email'
  | 'card_created'
  | 'support'
  | 'feedback'
  | 'message'
  | 'event'
  | 'system'

export type AppNotification = {
  id: string
  audience: NotificationAudience
  category: NotificationCategory
  title: string
  body: string
  href?: string
  read: boolean
  createdAt: string
  meta?: Record<string, string>
}

export type NotificationPrefs = {
  browserPush: boolean
  emailNotifications: boolean
  contactSaves: boolean
  notesReplies: boolean
  weeklyInsight: boolean
  callEmail: boolean
  supportFeedback: boolean
  securityAlerts: boolean
  productUpdates: boolean
  cardCreated?: boolean
  messages?: boolean
}

const STORAGE_KEY = 'vbiz_notifications'
const PREFS_KEY = 'vbiz_notification_prefs'
const DISMISSED_ANNOUNCEMENT_IDS_KEY = 'vbiz_dismissed_announcement_ids'
const LEGACY_SEED_KEY = 'vbiz_notifications_seeded_v1'
const LEGACY_SEED_NOTIFICATION_IDS = new Set(['seed_single_1', 'seed_single_2', 'seed_corp_1', 'seed_admin_1'])

export const NOTIFICATIONS_EVENT = 'vbiz_notifications_update'
export const ANNOUNCEMENT_DISMISS_EVENT = 'announcement-dismiss'

const DEFAULT_PREFS: NotificationPrefs = {
  browserPush: true,
  emailNotifications: true,
  contactSaves: true,
  notesReplies: true,
  weeklyInsight: true,
  callEmail: true,
  supportFeedback: true,
  securityAlerts: true,
  productUpdates: false,
  cardCreated: true,
  messages: true,
}

function readRawPrefs(): Partial<NotificationPrefs> | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Partial<NotificationPrefs>
  } catch {
    return null
  }
}

export function getNotificationPrefs(): NotificationPrefs {
  return { ...DEFAULT_PREFS, ...(readRawPrefs() || {}) }
}

/** Alias used by NotificationCenter */
export function loadNotificationPrefs(): NotificationPrefs {
  return getNotificationPrefs()
}

export function saveNotificationPrefs(patch: Partial<NotificationPrefs>): NotificationPrefs {
  const next = { ...getNotificationPrefs(), ...patch }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
    }
  } catch {
    /* ignore */
  }
  return next
}

export function loadNotifications(): AppNotification[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return removeLegacySeedNotifications(parsed as AppNotification[])
  } catch {
    return []
  }
}

function removeLegacySeedNotifications(list: AppNotification[]): AppNotification[] {
  const filtered = list.filter((n) => {
    const id = typeof n?.id === 'string' ? n.id : ''
    return !LEGACY_SEED_NOTIFICATION_IDS.has(id) && !id.startsWith('seed_')
  })

  try {
    localStorage.removeItem(LEGACY_SEED_KEY)
    if (filtered.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, 200)))
    }
  } catch {
    /* ignore */
  }

  return filtered
}

function persist(list: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 200)))
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
}

export function listNotifications(audience: NotificationAudience): AppNotification[] {
  return loadNotifications()
    .filter((n) => n.audience === audience)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function unreadCount(audience: NotificationAudience): number {
  return listNotifications(audience).filter((n) => !n.read).length
}

export function markNotificationRead(id: string) {
  const list = loadNotifications()
  const idx = list.findIndex((n) => n.id === id)
  if (idx < 0) return
  list[idx] = { ...list[idx], read: true }
  persist(list)
}

function loadDismissedAnnouncementIds(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  try {
    const raw = localStorage.getItem(DISMISSED_ANNOUNCEMENT_IDS_KEY)
    if (!raw) return new Set()
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.map((id) => String(id).trim()).filter(Boolean))
  } catch {
    return new Set()
  }
}

function persistDismissedAnnouncementIds(ids: Set<string>) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(DISMISSED_ANNOUNCEMENT_IDS_KEY, JSON.stringify([...ids].slice(-500)))
    window.dispatchEvent(new Event(ANNOUNCEMENT_DISMISS_EVENT))
  } catch {
    /* ignore quota / private mode */
  }
}

/** Durable per-browser memory: deleted/dismissed announcements must not reappear in the bell. */
export function markAnnouncementUserDismissed(announcementId: string) {
  const id = announcementId.trim()
  if (!id) return
  const ids = loadDismissedAnnouncementIds()
  ids.add(id)
  persistDismissedAnnouncementIds(ids)
  try {
    localStorage.setItem(`announcement:${id}:dismissed`, '1')
  } catch {
    /* ignore */
  }
}

export function isAnnouncementUserDismissed(announcementId: string): boolean {
  const id = announcementId.trim()
  if (!id) return false
  if (loadDismissedAnnouncementIds().has(id)) return true
  try {
    return localStorage.getItem(`announcement:${id}:dismissed`) === '1'
  } catch {
    return false
  }
}

export function deleteNotification(id: string) {
  const list = loadNotifications()
  const target = list.find((n) => n.id === id)
  const announcementId = target?.meta?.announcementId?.trim()
  if (announcementId) markAnnouncementUserDismissed(announcementId)
  persist(list.filter((n) => n.id !== id))
}

/** Remove every local inbox/bell row for an announcement and remember the dismiss. */
export function dismissAnnouncementEverywhere(announcementId: string) {
  const id = announcementId.trim()
  if (!id) return
  markAnnouncementUserDismissed(id)
  const list = loadNotifications().filter((n) => n.meta?.announcementId !== id)
  persist(list)
}

export function markAllNotificationsRead(audience: NotificationAudience) {
  const list = loadNotifications().map((n) => (n.audience === audience ? { ...n, read: true } : n))
  persist(list)
}

export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted') return 'granted'
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

const DASH_PUSH_SESSION_KEY = 'vbiz_dash_push_prompt_session'
export const DASHBOARD_PUSH_PROMPT_EVENT = 'vbiz_dash_push_prompt'

export function clearDashboardPushPromptSession() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.removeItem(DASH_PUSH_SESSION_KEY)
  } catch {
    /* ignore */
  }
}

export function markDashboardPushPromptSeenThisSession() {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(DASH_PUSH_SESSION_KEY, '1')
  } catch {
    /* ignore */
  }
}

export function dashboardPushPromptSeenThisSession(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(DASH_PUSH_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function openDashboardPushPrompt() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event(DASHBOARD_PUSH_PROMPT_EVENT))
}

/** Turn push back on from Settings and ask the browser for permission. */
export async function activateDashboardPush(): Promise<NotificationPermission | 'unsupported'> {
  saveNotificationPrefs({ browserPush: true })
  clearDashboardPushPromptSession()
  const permission = await ensureNotificationPermission()
  if (permission !== 'granted') openDashboardPushPrompt()
  return permission
}

export async function deactivateDashboardPush(): Promise<void> {
  saveNotificationPrefs({ browserPush: false })
  markDashboardPushPromptSeenThisSession()
}

export function roleToAudience(role?: string | null, ownerMode?: 'single' | 'corporate' | null): NotificationAudience {
  if (role === 'admin' || role === 'super-admin') return 'admin'
  if (ownerMode === 'corporate' || ownerMode === 'single') return ownerMode
  if (role === 'corporate-owner') return 'corporate'
  return 'single'
}

function categoryAllowed(category: NotificationCategory, prefs: NotificationPrefs): boolean {
  switch (category) {
    case 'contact_save':
      return prefs.contactSaves
    case 'note':
    case 'reply':
      return prefs.notesReplies
    case 'weekly_insight':
      return prefs.weeklyInsight
    case 'call':
    case 'email':
      return prefs.callEmail
    case 'card_created':
      return prefs.cardCreated !== false
    case 'support':
    case 'feedback':
      return prefs.supportFeedback
    case 'message':
    case 'event':
      return prefs.messages !== false
    default:
      return true
  }
}

function maybeBrowserNotify(n: AppNotification, prefs: NotificationPrefs) {
  if (!prefs.browserPush) return
  if (typeof window === 'undefined' || !('Notification' in window)) return
  if (Notification.permission !== 'granted') return
  try {
    const note = new Notification(n.title, {
      body: n.body,
      tag: n.id,
      icon: '/logo-vbizme.webp',
    })
    note.onclick = () => {
      window.focus()
      if (n.href) {
        if (n.href.startsWith('#')) window.location.hash = n.href
        else window.location.href = n.href
      }
      note.close()
    }
  } catch {
    /* ignore */
  }
}

export function pushNotification(input: {
  audience: NotificationAudience
  category: NotificationCategory
  title: string
  body: string
  href?: string
  meta?: Record<string, string>
  /** Force browser toast even if category muted (still respects browserPush) */
  forceBrowser?: boolean
}): AppNotification {
  const prefs = getNotificationPrefs()

  const n: AppNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    audience: input.audience,
    category: input.category,
    title: input.title,
    body: input.body,
    href: input.href,
    read: false,
    createdAt: new Date().toISOString(),
    meta: input.meta,
  }

  const list = loadNotifications()
  list.unshift(n)
  persist(list)

  if (input.forceBrowser || categoryAllowed(input.category, prefs)) {
    maybeBrowserNotify(n, prefs)
  }

  return n
}

export function notifyOwners(input: {
  category: NotificationCategory
  title: string
  body: string
  href?: string
  meta?: Record<string, string>
  forceBrowser?: boolean
  /** When set, only notify this owner audience (not both single + corporate). */
  audience?: NotificationAudience
}) {
  const audiences = input.audience ? [input.audience] : (['single', 'corporate'] as const)
  audiences.forEach((audience) => {
    pushNotification({
      audience,
      category: input.category,
      title: input.title,
      body: input.body,
      href: input.href || '/',
      meta: input.meta,
      forceBrowser: input.forceBrowser,
    })
  })
}

/** Notify only the card owner audience for a specific profile (never broadcast to all roles). */
export function notifyCardOwner(input: {
  ownerAudience: 'single' | 'corporate'
  category: NotificationCategory
  title: string
  body: string
  profileId: string
  href?: string
  forceBrowser?: boolean
}) {
  pushNotification({
    audience: input.ownerAudience,
    category: input.category,
    title: input.title,
    body: input.body,
    href: input.href || `/vcards/edit/home/${input.profileId}`,
    meta: { profileId: input.profileId },
    forceBrowser: input.forceBrowser,
  })
}

/**
 * Seed the owner bell from a server-backed active announcement (once per announcement id).
 * Global admin publish only writes localStorage on the admin browser — owners need this.
 * Never re-seed after the user deleted/dismissed that announcement.
 */
export function seedActiveAnnouncementNotification(input: {
  audience: 'single' | 'corporate'
  announcementId: string
  title: string
  body: string
  profileId?: string
  href?: string
}) {
  const announcementId = input.announcementId.trim()
  if (!announcementId) return null
  if (isAnnouncementUserDismissed(announcementId)) return null

  const already = loadNotifications().some(
    (n) => n.audience === input.audience && n.meta?.announcementId === announcementId
  )
  if (already) return null

  return pushNotification({
    audience: input.audience,
    category: 'system',
    title: input.title,
    body: input.body,
    href: input.href || (input.profileId ? `/vcards/edit/home/${input.profileId}` : '/'),
    meta: {
      announcementId,
      ...(input.profileId ? { profileId: input.profileId } : {}),
    },
    // Browser toast only on first seed — never again after dismiss/delete.
    forceBrowser: true,
  })
}

export function notifyOwnerAndAdmin(opts: {
  ownerAudience: NotificationAudience
  category: NotificationCategory
  ownerTitle: string
  ownerBody: string
  adminTitle: string
  adminBody: string
  ownerHref?: string
  adminHref?: string
  forceBrowser?: boolean
}) {
  pushNotification({
    audience: opts.ownerAudience,
    category: opts.category,
    title: opts.ownerTitle,
    body: opts.ownerBody,
    href: opts.ownerHref || '/',
    forceBrowser: opts.forceBrowser,
  })
  pushNotification({
    audience: 'admin',
    category: opts.category,
    title: opts.adminTitle,
    body: opts.adminBody,
    href: opts.adminHref || '/admin/leads',
    forceBrowser: opts.forceBrowser,
  })
}

export function getCurrentUserRole(): NotificationAudience | string {
  if (typeof window === 'undefined') return 'single'
  return localStorage.getItem('user_role') || 'single'
}
