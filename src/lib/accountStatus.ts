export type AccountStatus = 'ACTIVE' | 'PAUSED' | 'SUSPENDED'

export const ACCOUNT_PAUSED_VCARD_MESSAGE = 'Please contact support to re-enable this card.'

export const ACCOUNT_PAUSED_CREATE_MESSAGE =
  'Your account is paused. You cannot create or edit vCards. Please contact support.'

export const ACCOUNT_SUSPENDED_MESSAGE = 'Your account is suspended. Contact an administrator to restore access.'

export function normalizeAccountStatus(status?: string | null, isActive?: boolean): AccountStatus {
  const raw = String(status || '')
    .trim()
    .toUpperCase()
  if (raw === 'PAUSED' || raw === 'SUSPENDED' || raw === 'ACTIVE') return raw
  return isActive === false ? 'PAUSED' : 'ACTIVE'
}

export function isAccountPaused(status?: string | null, isActive?: boolean): boolean {
  return normalizeAccountStatus(status, isActive) === 'PAUSED'
}

export function isAccountSuspended(status?: string | null, isActive?: boolean): boolean {
  return normalizeAccountStatus(status, isActive) === 'SUSPENDED'
}

export function canMutateVcards(status?: string | null, isActive?: boolean): boolean {
  return normalizeAccountStatus(status, isActive) === 'ACTIVE'
}

export function canPerformAccountActions(status?: string | null, isActive?: boolean): boolean {
  const s = normalizeAccountStatus(status, isActive)
  return s === 'ACTIVE' || s === 'PAUSED'
}
