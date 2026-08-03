import type { NotificationPreferenceKey, NotificationPreferences } from '@/lib/push/types'

/** Preference keys returned by `GET /push/subscription-status` and `PUT /push/preferences`. */
export type BackendNotificationPreferenceKey =
  | 'service_updates'
  | 'portfolio_updates'
  | 'contact_updates'
  | 'offers'
  | 'business_hours'
  | 'news'
  | 'event_updates'
  | 'announcement_updates'
  | 'theme_updates'

export type BackendNotificationPreferences = Record<BackendNotificationPreferenceKey, boolean>

export const BACKEND_NOTIFICATION_PREFERENCE_OPTIONS: Array<{ id: BackendNotificationPreferenceKey; label: string }> = [
  { id: 'contact_updates', label: '📞 Updated contact info' },
  { id: 'portfolio_updates', label: '🎬 New videos or photos' },
  { id: 'news', label: '📝 New blog posts' },
  { id: 'service_updates', label: '🛠️ Services section updates' },
  { id: 'business_hours', label: '🏢 Professional updates' },
  { id: 'offers', label: '🎁 Offers & promotions' },
  { id: 'event_updates', label: '📅 New events' },
  { id: 'announcement_updates', label: '📢 New announcements' },
  { id: 'theme_updates', label: '🎨 Theme & design updates' },
]

const UI_TO_BACKEND: Record<NotificationPreferenceKey, BackendNotificationPreferenceKey> = {
  contact: 'contact_updates',
  video: 'portfolio_updates',
  blog: 'news',
  company: 'business_hours',
  services: 'service_updates',
  events: 'event_updates',
  announcements: 'announcement_updates',
}

const BACKEND_TO_UI: Record<BackendNotificationPreferenceKey, NotificationPreferenceKey | null> = {
  contact_updates: 'contact',
  portfolio_updates: 'video',
  news: 'blog',
  business_hours: 'company',
  service_updates: 'services',
  event_updates: 'events',
  announcement_updates: 'announcements',
  offers: null,
  theme_updates: null,
}

export const DEFAULT_BACKEND_NOTIFICATION_PREFERENCES: BackendNotificationPreferences = {
  service_updates: true,
  portfolio_updates: true,
  contact_updates: true,
  offers: true,
  business_hours: true,
  news: true,
  event_updates: true,
  announcement_updates: true,
  theme_updates: false,
}

export function toBackendPreferences(
  prefs: Partial<NotificationPreferences>,
  base?: Partial<BackendNotificationPreferences>
): BackendNotificationPreferences {
  const merged = { ...DEFAULT_BACKEND_NOTIFICATION_PREFERENCES, ...base }
  for (const [uiKey, backendKey] of Object.entries(UI_TO_BACKEND) as Array<
    [NotificationPreferenceKey, BackendNotificationPreferenceKey]
  >) {
    if (typeof prefs[uiKey] === 'boolean') {
      merged[backendKey] = prefs[uiKey]!
    }
  }
  return merged
}

export function normalizeBackendPreferences(
  backend: Partial<BackendNotificationPreferences> | null | undefined
): BackendNotificationPreferences {
  return { ...DEFAULT_BACKEND_NOTIFICATION_PREFERENCES, ...backend }
}

export function fromBackendPreferences(
  backend: Partial<BackendNotificationPreferences> | null | undefined
): NotificationPreferences {
  const defaults: NotificationPreferences = {
    contact: true,
    video: true,
    blog: true,
    company: true,
    services: true,
    events: true,
    announcements: true,
  }
  if (!backend) return defaults

  const result = { ...defaults }
  for (const [backendKey, uiKey] of Object.entries(BACKEND_TO_UI) as Array<
    [BackendNotificationPreferenceKey, NotificationPreferenceKey | null]
  >) {
    if (uiKey && typeof backend[backendKey] === 'boolean') {
      result[uiKey] = backend[backendKey]!
    }
  }
  return result
}

export function backendPreferencesFromUiRecord(prefs: NotificationPreferences): BackendNotificationPreferences {
  return toBackendPreferences(prefs)
}
