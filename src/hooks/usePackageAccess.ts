'use client'

import { useAppSelector } from '@/hooks/redux'
import {
  allPackageAccessEnabled,
  catalogFeatureAllowed,
  type PackageAccessKey,
  type PackageAccessMap,
} from '@/lib/packageAccess'
import { useGetEntitlementsQuery, type EffectiveEntitlements } from '@/redux/features/profiles/profiles.api'

const fallbackAccess = allPackageAccessEnabled()

export function usePackageAccess(): PackageAccessMap & {
  isLoading: boolean
  can: (key: PackageAccessKey | string) => boolean
  entitlements: EffectiveEntitlements | undefined
} {
  const userId = useAppSelector((state) => state.user.user?.id)
  const { data, isLoading, isUninitialized } = useGetEntitlementsQuery(undefined, { skip: !userId })
  const access = data?.access ?? fallbackAccess

  return {
    ...access,
    isLoading: Boolean(userId) && (isLoading || isUninitialized) && !data,
    can: (key) => (data ? catalogFeatureAllowed(data, key) : access[key as PackageAccessKey] !== false),
    entitlements: data,
  }
}
