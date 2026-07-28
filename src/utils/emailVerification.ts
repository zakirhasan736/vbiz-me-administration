import { EMAIL_NOT_VERIFIED, EMAIL_VERIFICATION_COOLDOWN_KEY, EMAIL_VERIFICATION_STORAGE_KEY } from '@/constants'
import type { IQueryMutationErrorResponse } from '@/interfaces'

export type TVerificationCooldown = {
  cooldownEnd?: number
  remainingSecond?: number
}

let emailVerificationSnapshotCache: { key: string; value: string | null } | null = null
const emailVerificationListeners = new Set<() => void>()

function notifyEmailVerificationListeners() {
  emailVerificationListeners.forEach((listener) => listener())
}

function resolveCooldownEnd(cooldown?: TVerificationCooldown): number | null {
  if (!cooldown) return null

  if (typeof cooldown.cooldownEnd === 'number' && cooldown.cooldownEnd > 0) {
    return cooldown.cooldownEnd
  }

  if (typeof cooldown.remainingSecond === 'number' && cooldown.remainingSecond > 0) {
    return Date.now() + cooldown.remainingSecond * 1000
  }

  return null
}

export function isEmailNotVerified(error: IQueryMutationErrorResponse | undefined): boolean {
  return error?.data?.code === EMAIL_NOT_VERIFIED && typeof error?.data?.data?.email === 'string'
}

export function handleEmailNotVerified(error: IQueryMutationErrorResponse) {
  const email = error.data.data?.email
  if (!email) return false

  storeEmailVerificationSession(email, {
    cooldownEnd: typeof error.data.data?.cooldownEnd === 'number' ? error.data.data.cooldownEnd : undefined,
    remainingSecond: typeof error.data.data?.remainingSecond === 'number' ? error.data.data.remainingSecond : undefined,
  })
  return true
}

export function storeEmailVerificationSession(email: string, cooldown?: TVerificationCooldown) {
  sessionStorage.setItem(EMAIL_VERIFICATION_STORAGE_KEY, email.trim())

  const cooldownEnd = resolveCooldownEnd(cooldown)
  if (cooldownEnd) {
    sessionStorage.setItem(EMAIL_VERIFICATION_COOLDOWN_KEY, String(cooldownEnd))
  } else {
    sessionStorage.removeItem(EMAIL_VERIFICATION_COOLDOWN_KEY)
  }

  emailVerificationSnapshotCache = null
  notifyEmailVerificationListeners()
}

export function clearEmailVerificationSession() {
  sessionStorage.removeItem(EMAIL_VERIFICATION_STORAGE_KEY)
  sessionStorage.removeItem(EMAIL_VERIFICATION_COOLDOWN_KEY)
  emailVerificationSnapshotCache = null
  notifyEmailVerificationListeners()
}

export function readEmailVerificationSession(): string | null {
  if (typeof window === 'undefined') return null

  const email = sessionStorage.getItem(EMAIL_VERIFICATION_STORAGE_KEY)?.trim()
  return email || null
}

export function readEmailVerificationCooldownEnd(): number | null {
  if (typeof window === 'undefined') return null

  const raw = sessionStorage.getItem(EMAIL_VERIFICATION_COOLDOWN_KEY)
  if (!raw) return null

  const cooldownEnd = Number(raw)
  if (!Number.isFinite(cooldownEnd) || cooldownEnd <= 0) return null

  return cooldownEnd
}

/** Stable snapshot for useSyncExternalStore (same reference until storage changes). */
export function getEmailVerificationSnapshot(): string | null {
  if (typeof window === 'undefined') return null

  const key = `${sessionStorage.getItem(EMAIL_VERIFICATION_STORAGE_KEY) ?? ''}|${sessionStorage.getItem(EMAIL_VERIFICATION_COOLDOWN_KEY) ?? ''}`

  if (emailVerificationSnapshotCache?.key === key) {
    return emailVerificationSnapshotCache.value
  }

  const value = readEmailVerificationSession()
  emailVerificationSnapshotCache = { key, value }
  return value
}

export function getEmailVerificationServerSnapshot(): string | null {
  return null
}

export function subscribeEmailVerificationSnapshot(onStoreChange: () => void) {
  emailVerificationListeners.add(onStoreChange)
  return () => {
    emailVerificationListeners.delete(onStoreChange)
  }
}
