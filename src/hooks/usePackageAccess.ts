'use client'

import { useAppSelector } from '@/hooks/redux'
import { entitlementsForRole, type PackageAccessKey, type PackageAccessMap } from '@/lib/packageAccess'
import { useGetSubscriptionsQuery, type OwnerSubscription } from '@/redux/features/profiles/profiles.api'
import { useMemo } from 'react'

function isActiveSubscription(sub: OwnerSubscription, now = Date.now()) {
  if (sub.endsAt == null || sub.endsAt === '') return true
  const ends = new Date(sub.endsAt).getTime()
  return Number.isFinite(ends) && ends > now
}

export function usePackageAccess(): PackageAccessMap & { isLoading: boolean; can: (key: PackageAccessKey) => boolean } {
  const role = useAppSelector((state) => state.user.user?.role)
  const { data: subscriptions = [], isLoading } = useGetSubscriptionsQuery()

  const access = useMemo(() => {
    const active = subscriptions.find((sub) => isActiveSubscription(sub))
    return entitlementsForRole(role, active?.package?.features)
  }, [role, subscriptions])

  return {
    ...access,
    isLoading,
    can: (key) => access[key],
  }
}
