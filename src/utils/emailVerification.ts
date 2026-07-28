import { EMAIL_NOT_VERIFIED, EMAIL_VERIFICATION_STORAGE_KEY } from '@/constants'
import type { IQueryMutationErrorResponse } from '@/interfaces'

let emailVerificationSnapshotCache: { key: string; value: string | null } | null = null
const emailVerificationListeners = new Set<() => void>()

function notifyEmailVerificationListeners() {
  emailVerificationListeners.forEach((listener) => listener())
}

export function isEmailNotVerified(error: IQueryMutationErrorResponse | undefined): boolean {
  return error?.data?.code === EMAIL_NOT_VERIFIED && typeof error?.data?.data?.email === 'string'
}

export function handleEmailNotVerified(error: IQueryMutationErrorResponse) {
  const email = error.data.data?.email
  if (!email) return false

  storeEmailVerificationSession(email)
  return true
}

export function storeEmailVerificationSession(email: string) {
  sessionStorage.setItem(EMAIL_VERIFICATION_STORAGE_KEY, email.trim())
  emailVerificationSnapshotCache = null
  notifyEmailVerificationListeners()
}

export function clearEmailVerificationSession() {
  sessionStorage.removeItem(EMAIL_VERIFICATION_STORAGE_KEY)
  emailVerificationSnapshotCache = null
  notifyEmailVerificationListeners()
}

export function readEmailVerificationSession(): string | null {
  if (typeof window === 'undefined') return null

  const email = sessionStorage.getItem(EMAIL_VERIFICATION_STORAGE_KEY)?.trim()
  return email || null
}

/** Stable snapshot for useSyncExternalStore (same reference until storage changes). */
export function getEmailVerificationSnapshot(): string | null {
  if (typeof window === 'undefined') return null

  const key = sessionStorage.getItem(EMAIL_VERIFICATION_STORAGE_KEY) ?? ''

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
