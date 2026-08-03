const DECLINE_PREFIX = 'vbiz_push_declined_'

function declineKey(cardSlug: string) {
  return `${DECLINE_PREFIX}${cardSlug.trim().toLowerCase()}`
}

/** User tapped "Not Now" on the follow prompt for this profile (persists across tabs). */
export function hasDeclinedNotificationPrompt(cardSlug: string): boolean {
  if (typeof window === 'undefined' || !cardSlug.trim()) return false
  try {
    if (localStorage.getItem(declineKey(cardSlug)) === '1') return true
    // Migrate legacy session-only decline.
    if (sessionStorage.getItem(declineKey(cardSlug)) === '1') {
      localStorage.setItem(declineKey(cardSlug), '1')
      sessionStorage.removeItem(declineKey(cardSlug))
      return true
    }
    return false
  } catch {
    return false
  }
}

export function markNotificationDeclinedForCard(cardSlug: string) {
  if (!cardSlug.trim()) return
  try {
    localStorage.setItem(declineKey(cardSlug), '1')
    sessionStorage.removeItem(declineKey(cardSlug))
  } catch {
    /* private mode */
  }
}

export function clearNotificationDeclinedForCard(cardSlug: string) {
  if (!cardSlug.trim()) return
  try {
    localStorage.removeItem(declineKey(cardSlug))
    sessionStorage.removeItem(declineKey(cardSlug))
  } catch {
    /* ignore */
  }
}

/** @deprecated Subscription state comes from the backend API — use hasDeclinedNotificationPrompt only. */
export function notificationChoiceKeyForCard(_cardSlug: string) {
  return ''
}

/** @deprecated */
export function readNotificationChoiceForCard(cardSlug: string): 'declined' | null {
  return hasDeclinedNotificationPrompt(cardSlug) ? 'declined' : null
}

/** @deprecated No-op for subscribed; clears decline flag when subscribing. */
export function writeNotificationChoiceForCard(cardSlug: string, value: 'subscribed' | 'declined') {
  if (value === 'declined') {
    markNotificationDeclinedForCard(cardSlug)
    return
  }
  clearNotificationDeclinedForCard(cardSlug)
}

/** True only when user declined the prompt this session (not subscription state). */
export function hasNotificationChoiceForCard(cardSlug: string): boolean {
  return hasDeclinedNotificationPrompt(cardSlug)
}

/** @deprecated */
export function hasNotificationChoice(_cardOwnerId: string, cardSlug?: string): boolean {
  if (!cardSlug?.trim()) return false
  return hasNotificationChoiceForCard(cardSlug)
}

/** @deprecated */
export function writeNotificationChoice(cardOwnerId: string, value: 'subscribed' | 'declined', cardSlug?: string) {
  if (cardSlug?.trim()) {
    writeNotificationChoiceForCard(cardSlug, value)
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem(`vbiz_notification_choice_${cardOwnerId}`, value)
  }
}

export function writeContactFlowAsked(cardOwnerId: string, accepted: boolean, preferences?: unknown) {
  localStorage.setItem(
    `vbizme_notif_${cardOwnerId}`,
    JSON.stringify({ asked: true, accepted, preferences: preferences ?? null })
  )
}

export function hasContactFlowBeenAsked(cardOwnerId: string): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem(`vbizme_notif_${cardOwnerId}`))
}

let profileExperienceSettled = false

export const FORCE_NOTIFICATION_DELAY_MS = 2000
export const PLATFORM_UPDATE_EVENT = 'vbiz_platform_update'
export const PROFILE_EXPERIENCE_SETTLED_EVENT = 'vbiz_profile_experience_settled'

export type NotificationChoiceValue = 'subscribed' | 'declined'

export function notificationChoiceKey(cardOwnerId: string) {
  return `vbiz_notification_choice_${cardOwnerId}`
}

export function notifyProfileExperienceSettled() {
  if (typeof window === 'undefined') return
  profileExperienceSettled = true
  window.dispatchEvent(new Event(PROFILE_EXPERIENCE_SETTLED_EVENT))
}

export function isProfileExperienceSettled(): boolean {
  return profileExperienceSettled
}

/** @deprecated Prefer isSubscribedToCard() which checks the backend API. */
export function isSubscribedAnywhere(): boolean {
  return false
}
