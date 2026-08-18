'use client'

import { ModalPortal } from '@/components/ModalPortal'
import {
  NOTIFICATIONS_EVENT,
  deleteNotification,
  ensureNotificationPermission,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  type AppNotification,
  type NotificationAudience,
  type NotificationCategory,
} from '@/lib/notifications'
import { cn } from '@/utils/cn'
import {
  AlertCircle,
  Bell,
  Calendar,
  Check,
  CheckCheck,
  CreditCard,
  LifeBuoy,
  Mail,
  Megaphone,
  MessageCircle,
  Phone,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useMemo, useRef, useState, useSyncExternalStore, type ElementType } from 'react'

const CATEGORY_ICON: Record<NotificationCategory, ElementType> = {
  contact_save: Save,
  note: MessageCircle,
  reply: Megaphone,
  weekly_insight: Sparkles,
  call: Phone,
  email: Mail,
  card_created: CreditCard,
  support: LifeBuoy,
  feedback: LifeBuoy,
  message: MessageCircle,
  event: Calendar,
  system: AlertCircle,
}

type NotificationCenterProps = {
  audience: NotificationAudience
  title?: string
  className?: string
}

function formatWhen(iso: string) {
  try {
    const d = new Date(iso)
    const diff = Date.now() - d.getTime()
    if (diff < 60_000) return 'Just now'
    if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`
    if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`
    return d.toLocaleDateString()
  } catch {
    return ''
  }
}

let notificationStoreVersion = 0
const notificationSnapshots = new Map<NotificationAudience, { version: number; items: AppNotification[] }>()

function subscribeToNotifications(onStoreChange: () => void) {
  const onUpdate = () => {
    notificationStoreVersion += 1
    onStoreChange()
  }
  window.addEventListener(NOTIFICATIONS_EVENT, onUpdate)
  window.addEventListener('storage', onUpdate)
  return () => {
    window.removeEventListener(NOTIFICATIONS_EVENT, onUpdate)
    window.removeEventListener('storage', onUpdate)
  }
}

function getNotificationsSnapshot(audience: NotificationAudience): AppNotification[] {
  const cached = notificationSnapshots.get(audience)
  if (cached && cached.version === notificationStoreVersion) return cached.items
  const items = listNotifications(audience)
  notificationSnapshots.set(audience, { version: notificationStoreVersion, items })
  return items
}

function getServerNotificationsSnapshot(): AppNotification[] {
  return []
}

function subscribeToNotificationPermission(onStoreChange: () => void) {
  window.addEventListener(NOTIFICATIONS_EVENT, onStoreChange)
  return () => window.removeEventListener(NOTIFICATIONS_EVENT, onStoreChange)
}

function getNotificationPermissionSnapshot(): NotificationPermission | 'unsupported' {
  if (!('Notification' in window)) return 'unsupported'
  return Notification.permission
}

function getServerNotificationPermissionSnapshot(): NotificationPermission | 'unsupported' {
  return 'unsupported'
}

export function NotificationCenter({ audience, title = 'Your Alerts', className }: NotificationCenterProps) {
  const router = useRouter()
  const btnRef = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState({ top: 0, right: 0 })

  const storedItems = useSyncExternalStore(
    subscribeToNotifications,
    () => getNotificationsSnapshot(audience),
    getServerNotificationsSnapshot
  )
  const [readOverrides, setReadOverrides] = useState<Set<string>>(() => new Set())
  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => new Set())
  const items = useMemo(
    () =>
      storedItems
        .filter((item) => !deletedIds.has(item.id))
        .map((item) => (readOverrides.has(item.id) ? { ...item, read: true } : item)),
    [deletedIds, readOverrides, storedItems]
  )
  const unread = items.reduce((count, item) => count + (item.read ? 0 : 1), 0)

  const perm = useSyncExternalStore(
    subscribeToNotificationPermission,
    getNotificationPermissionSnapshot,
    getServerNotificationPermissionSnapshot
  )

  const toggle = () => {
    if (!open && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setPos({
        top: rect.bottom + 10,
        right: Math.max(12, window.innerWidth - rect.right),
      })
    }
    setOpen((v) => !v)
  }

  const handleOpenItem = (n: AppNotification) => {
    markNotificationRead(n.id)
    setReadOverrides((current) => new Set(current).add(n.id))
    setOpen(false)
    if (!n.href) return
    router.push(n.href)
  }

  const handleMarkAllRead = () => {
    markAllNotificationsRead(audience)
    setReadOverrides((current) => {
      const next = new Set(current)
      storedItems.forEach((item) => {
        if (item.audience === audience) next.add(item.id)
      })
      return next
    })
  }

  const handleDelete = (id: string) => {
    deleteNotification(id)
    setDeletedIds((current) => new Set(current).add(id))
  }

  return (
    <div className={cn('relative isolate z-80', className)}>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className="relative flex items-center justify-center rounded-xl border border-slate-200/80 bg-white p-2.5 text-slate-600 shadow-sm transition-all hover:bg-slate-100 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10"
        title="Notifications"
        aria-expanded={open}
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-black text-white shadow-md">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <ModalPortal>
          <div className="fixed inset-0 z-400" aria-hidden onClick={() => setOpen(false)} />
          <div
            className="animate-in zoom-in-95 fixed z-410 w-[min(24rem,calc(100vw-1.5rem))] rounded-2xl border border-slate-200 bg-white p-4 text-left shadow-2xl duration-150 dark:border-white/10 dark:bg-[#0d1222]"
            style={{ top: pos.top, right: pos.right }}
            role="dialog"
            aria-label={title}
          >
            <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-3 dark:border-white/5">
              <h4 className="text-sm font-black text-slate-900 dark:text-white">{title}</h4>
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-primary-500 inline-flex items-center gap-1 text-[10px] font-black tracking-wider uppercase hover:underline"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all read
              </button>
            </div>

            {perm !== 'granted' && perm !== 'unsupported' && (
              <button
                type="button"
                onClick={async () => {
                  await ensureNotificationPermission()
                  window.dispatchEvent(new Event(NOTIFICATIONS_EVENT))
                }}
                className="mb-3 w-full rounded-xl border border-amber-200/70 bg-amber-50 px-3 py-2.5 text-left dark:border-amber-500/20 dark:bg-amber-500/10"
              >
                <p className="text-[11px] font-black tracking-wider text-amber-700 uppercase dark:text-amber-300">
                  Enable browser alerts
                </p>
                <p className="mt-0.5 text-[10px] font-semibold text-amber-600/90 dark:text-amber-200/80">
                  Get notified about new saves, replies, and support even when this page is in the background.
                </p>
              </button>
            )}

            <div className="max-h-85 space-y-2.5 overflow-y-auto">
              {items.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell className="mx-auto mb-2 h-8 w-8 text-slate-300 dark:text-white/10" />
                  <p className="text-xs font-bold text-slate-500">No notifications yet</p>
                </div>
              ) : (
                items.map((n) => {
                  const Icon = CATEGORY_ICON[n.category] || AlertCircle
                  return (
                    <div
                      key={n.id}
                      className={cn(
                        'flex w-full gap-2 rounded-xl border p-3 text-left transition-colors',
                        n.read
                          ? 'border-slate-100 bg-slate-50/50 opacity-80 dark:border-white/5 dark:bg-white/1'
                          : 'border-primary-500/10 bg-primary-500/5 dark:border-primary-500/20 dark:bg-primary-500/10'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => handleOpenItem(n)}
                        className="flex min-w-0 flex-1 gap-2.5 text-left"
                      >
                        <Icon className="mt-0.5 h-4.5 w-4.5 shrink-0 text-slate-500" />
                        <div className="min-w-0">
                          <p className="flex items-center gap-1.5 text-xs font-black text-slate-900 dark:text-white">
                            <span className="truncate">{n.title}</span>
                            {!n.read && <span className="bg-primary-500 h-1.5 w-1.5 shrink-0 rounded-full" />}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">
                            {n.body}
                          </p>
                          <span className="mt-1.5 block text-[9px] font-bold text-slate-400">
                            {formatWhen(n.createdAt)} · {n.category.replace('_', ' ')}
                          </span>
                        </div>
                      </button>
                      <div className="flex shrink-0 flex-col gap-1">
                        {!n.read && (
                          <button
                            type="button"
                            title="Mark as read"
                            aria-label="Mark as read"
                            onClick={(e) => {
                              e.stopPropagation()
                              markNotificationRead(n.id)
                              setReadOverrides((current) => new Set(current).add(n.id))
                            }}
                            className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/80 hover:text-emerald-600 dark:hover:bg-white/10 dark:hover:text-emerald-400"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                        )}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete notification"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDelete(n.id)
                          }}
                          className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white/80 hover:text-red-500 dark:hover:bg-white/10 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  )
}

export default NotificationCenter
