import type { BackendNotificationPreferences } from '@/lib/push/preferenceMapping'

export type NotificationPreferenceKey =
  'contact' | 'video' | 'blog' | 'company' | 'services' | 'events' | 'announcements'

export type NotificationPreferences = Record<NotificationPreferenceKey, boolean>

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  contact: true,
  video: true,
  blog: true,
  company: true,
  services: true,
  events: true,
  announcements: true,
}

export type PushSubscriptionKeys = {
  p256dh: string
  auth: string
}

export type PushSubscriptionPayload = {
  endpoint: string
  expirationTime?: number | null
  keys: PushSubscriptionKeys
}

export type PushSubscriptionStatusResponse = {
  success?: boolean
  subscribed: boolean
  preferences: Partial<BackendNotificationPreferences> | null
  message?: string
}

export type PushPreferencesUpdateResponse = {
  success?: boolean
  message?: string
  preferences?: Partial<BackendNotificationPreferences>
}

export type UpdatePreferencesResult = {
  message: string
  preferences: BackendNotificationPreferences
}

export type PushStatusResponse = {
  following: boolean
  permission: NotificationPermission | 'unsupported'
  preferences: NotificationPreferences | null
  backendPreferences: BackendNotificationPreferences | null
  endpoint: string | null
}

export type PlatformUpdateDetail = {
  title: string
  message: string
  businessName?: string
  avatarUrl?: string
  avatarImageUrl?: string
  avatarVideoUrl?: string
  category?: NotificationPreferenceKey
  url?: string
  slug?: string
  /** Friendly card link shown in copy (e.g. vbiz.me/slug) — not used for navigation. */
  displayLink?: string
}
