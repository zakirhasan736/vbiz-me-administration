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
const SEED_KEY = 'vbiz_notifications_seeded_v1'

export const NOTIFICATIONS_EVENT = 'vbiz_notifications_update'

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
    return JSON.parse(raw) as AppNotification[]
  } catch {
    return []
  }
}

function persist(list: AppNotification[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, 200)))
  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
}

export function ensureSeededNotifications() {
  if (typeof window === 'undefined') return
  if (localStorage.getItem(SEED_KEY)) return
  const now = Date.now()
  const seeds: AppNotification[] = [
    {
      id: 'seed_single_1',
      audience: 'single',
      category: 'contact_save',
      title: 'New contact saved',
      body: 'A guest shared their details on your vCard.',
      href: '/',
      read: false,
      createdAt: new Date(now - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'seed_single_2',
      audience: 'single',
      category: 'weekly_insight',
      title: 'Weekly insights ready',
      body: 'Your personal engagement summary for this week is available on the dashboard.',
      href: '/',
      read: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'seed_corp_1',
      audience: 'corporate',
      category: 'weekly_insight',
      title: 'Weekly engagement ready',
      body: 'Your team’s weekly insight summary is available on the dashboard.',
      href: '/',
      read: false,
      createdAt: new Date(now - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'seed_admin_1',
      audience: 'admin',
      category: 'support',
      title: 'New support request',
      body: 'An owner asked for help with billing and card limits.',
      href: '/settings',
      read: false,
      createdAt: new Date(now - 1000 * 60 * 55).toISOString(),
    },
  ]
  persist([...seeds, ...loadNotifications()])
  localStorage.setItem(SEED_KEY, '1')
}

export function listNotifications(audience: NotificationAudience): AppNotification[] {
  ensureSeededNotifications()
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

export function markAllNotificationsRead(audience: NotificationAudience) {
  const list = loadNotifications().map((n) => (n.audience === audience ? { ...n, read: true } : n))
  persist(list)
}

export async function ensureNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported'
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return Notification.permission
  }
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

export function roleToAudience(role?: string | null): NotificationAudience {
  if (role === 'corporate-owner') return 'corporate'
  if (role === 'admin' || role === 'super-admin') return 'admin'
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
      icon: '/favicon.ico',
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
