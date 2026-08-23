'use client'

import { useAppSelector } from '@/hooks/redux'
import { usePackageAccess } from '@/hooks/usePackageAccess'
import { resolveSessionOwnerMode, type OwnerMode } from '@/lib/packageOwnerMode'

export function useOwnerMode(): {
  ownerMode: OwnerMode | null
  isLoading: boolean
  isCorporateBackOffice: boolean
  isSingleBackOffice: boolean
} {
  const role = useAppSelector((state) => state.user.user?.role)
  const profileOwnerMode = useAppSelector((state) => state.user.user?.ownerMode)
  const { entitlements, isLoading } = usePackageAccess()
  const ownerMode = resolveSessionOwnerMode({
    role,
    entitlementsOwnerMode:
      entitlements?.ownerMode ||
      (entitlements?.backOffice === 'single' || entitlements?.backOffice === 'corporate'
        ? entitlements.backOffice
        : null),
    profileOwnerMode,
  })

  return {
    ownerMode,
    isLoading,
    isCorporateBackOffice: ownerMode === 'corporate',
    isSingleBackOffice: ownerMode === 'single',
  }
}
