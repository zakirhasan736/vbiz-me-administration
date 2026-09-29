'use client'

import { isStaffRole } from '@/constants/userRole'
import { useAppSelector } from '@/hooks/redux'
import {
  allPackageAccessEnabled,
  catalogFeatureAllowed,
  MANDATORY_PACKAGE_ACCESS_KEYS,
  resolvePerFileUploadLimit,
  type PackageAccessKey,
  type PackageAccessMap,
  type PerFileUploadLimit,
} from '@/lib/packageAccess'
import { useGetEntitlementsQuery, type EffectiveEntitlements } from '@/redux/features/profiles/profiles.api'

const fallbackAccess = allPackageAccessEnabled()

function withMandatoryAccess(access: PackageAccessMap): PackageAccessMap {
  const next = { ...access }
  for (const key of MANDATORY_PACKAGE_ACCESS_KEYS) {
    next[key] = true
  }
  return next
}

export function usePackageAccess(): PackageAccessMap & {
  isLoading: boolean
  can: (key: PackageAccessKey | string) => boolean
  entitlements: EffectiveEntitlements | undefined
} {
  const userId = useAppSelector((state) => state.user.user?.id)
  const role = useAppSelector((state) => state.user.user?.role)
  const shouldLoadEntitlements = Boolean(userId) && !isStaffRole(role)
  const { data, isLoading, isUninitialized } = useGetEntitlementsQuery(undefined, {
    skip: !shouldLoadEntitlements,
  })
  const access = withMandatoryAccess(data?.access ?? fallbackAccess)

  return {
    ...access,
    isLoading: shouldLoadEntitlements && (isLoading || isUninitialized) && !data,
    can: (key) => (data ? catalogFeatureAllowed({ ...data, access }, key) : access[key as PackageAccessKey] !== false),
    entitlements: data,
  }
}

/** Per-file image/video/document cap for the signed-in package. Not a card-wide total. */
export function useMediaUploadLimit(): PerFileUploadLimit {
  // Builder media: no package size gate — transport ceiling only. Videos are still client-optimized when feasible.
  return resolvePerFileUploadLimit(null, true)
}
