export function notificationChoiceKey(cardOwnerId: string) {
  return `vbiz_notification_choice_${cardOwnerId}`
}

export function hasNotificationChoice(cardOwnerId: string): boolean {
  if (typeof window === 'undefined') return false
  return Boolean(localStorage.getItem(notificationChoiceKey(cardOwnerId)))
}

export function notifyProfileExperienceSettled() {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new Event('vbiz_profile_experience_settled'))
}
