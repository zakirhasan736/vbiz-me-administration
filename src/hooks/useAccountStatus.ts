'use client'

import { useAppSelector } from '@/hooks/redux'
import {
  canMutateVcards,
  canPerformAccountActions,
  isAccountPaused,
  isAccountSuspended,
  normalizeAccountStatus,
  type AccountStatus,
} from '@/lib/accountStatus'

export function useAccountStatus() {
  const user = useAppSelector((state) => state.user.user)
  const accountStatus: AccountStatus = normalizeAccountStatus(user?.accountStatus, user?.isActive)

  return {
    accountStatus,
    isPaused: isAccountPaused(accountStatus),
    isSuspended: isAccountSuspended(accountStatus),
    canMutateVcards: canMutateVcards(accountStatus),
    canPerformAccountActions: canPerformAccountActions(accountStatus),
  }
}
