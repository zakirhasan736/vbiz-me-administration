'use client'

import { getNavDisplayLabel, type NavBarNavItem } from '@/lib/vcardNavbar'
import type { LucideIcon } from 'lucide-react'

export type V3NavTab = {
  id: string
  icon: LucideIcon
  label: string
}

/** Maps API navbar items into the flat tab list consumed by v1/v3 Navigation. */
export function mapNavItemsToV3Tabs(items: NavBarNavItem[]): V3NavTab[] {
  return items.map((item) => ({
    id: item.id,
    icon: item.icon,
    label: getNavDisplayLabel(item),
  }))
}
