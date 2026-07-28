import { AUTH_PROVIDER_LABELS, PASSWORD_SETUP_REQUIRED, PASSWORD_SETUP_STORAGE_KEYS } from '@/constants'
import type { IQueryMutationErrorResponse, TPasswordSetupRequiredData } from '@/interfaces'

let passwordSetupSnapshotCache: { key: string; value: TPasswordSetupRequiredData | null } | null = null

export function isPasswordSetupRequired(error: IQueryMutationErrorResponse | undefined): boolean {
  return (
    error?.data?.code === PASSWORD_SETUP_REQUIRED &&
    typeof error?.data?.data?.passwordSetupToken === 'string' &&
    error.data.data.passwordSetupToken.length > 0
  )
}

export function storePasswordSetupSession(data: TPasswordSetupRequiredData) {
  sessionStorage.setItem(PASSWORD_SETUP_STORAGE_KEYS.token, data.passwordSetupToken)
  sessionStorage.setItem(PASSWORD_SETUP_STORAGE_KEYS.email, data.email)
  sessionStorage.setItem(PASSWORD_SETUP_STORAGE_KEYS.providers, JSON.stringify(data.providers))
  passwordSetupSnapshotCache = null
}

export function clearPasswordSetupSession() {
  sessionStorage.removeItem(PASSWORD_SETUP_STORAGE_KEYS.token)
  sessionStorage.removeItem(PASSWORD_SETUP_STORAGE_KEYS.email)
  sessionStorage.removeItem(PASSWORD_SETUP_STORAGE_KEYS.providers)
  passwordSetupSnapshotCache = null
}

export function readPasswordSetupSession(): TPasswordSetupRequiredData | null {
  if (typeof window === 'undefined') return null

  const passwordSetupToken = sessionStorage.getItem(PASSWORD_SETUP_STORAGE_KEYS.token)
  const email = sessionStorage.getItem(PASSWORD_SETUP_STORAGE_KEYS.email)
  const providersRaw = sessionStorage.getItem(PASSWORD_SETUP_STORAGE_KEYS.providers)

  if (!passwordSetupToken || !email) return null

  let providers: string[] = []
  try {
    const parsed: unknown = providersRaw ? JSON.parse(providersRaw) : []
    providers = Array.isArray(parsed) ? parsed.filter((p): p is string => typeof p === 'string') : []
  } catch {
    providers = []
  }

  return {
    email,
    providers,
    passwordSetupToken,
    hasPassword: false,
  }
}

/** Stable snapshot for useSyncExternalStore (same reference until storage changes). */
export function getPasswordSetupSnapshot(): TPasswordSetupRequiredData | null {
  if (typeof window === 'undefined') return null

  const key = [
    sessionStorage.getItem(PASSWORD_SETUP_STORAGE_KEYS.token),
    sessionStorage.getItem(PASSWORD_SETUP_STORAGE_KEYS.email),
    sessionStorage.getItem(PASSWORD_SETUP_STORAGE_KEYS.providers),
  ].join('\0')

  if (passwordSetupSnapshotCache?.key === key) {
    return passwordSetupSnapshotCache.value
  }

  const value = readPasswordSetupSession()
  passwordSetupSnapshotCache = { key, value }
  return value
}

export function getPasswordSetupServerSnapshot(): TPasswordSetupRequiredData | null {
  return null
}

export function subscribePasswordSetupSnapshot() {
  return () => {}
}

export function getProviderLabel(provider?: string) {
  if (!provider) return 'social login'
  return AUTH_PROVIDER_LABELS[provider] ?? 'social login'
}

export function handlePasswordSetupRequired(error: IQueryMutationErrorResponse) {
  const data = error.data.data
  if (!data?.passwordSetupToken || !data.email) return false

  storePasswordSetupSession({
    email: data.email,
    providers: data.providers ?? [],
    passwordSetupToken: data.passwordSetupToken,
    hasPassword: Boolean(data.hasPassword),
  })
  return true
}
