'use client'

import { buildProfileSectionPath, DEFAULT_PROFILE_SECTION, parseSectionFromPathname } from '@/lib/profileRoutes'
import { filterNavItemsByVisibility, NAV_BAR_NAV_ITEMS } from '@/lib/vcardNavbar'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'
import { usePathname } from 'next/navigation'
import { useMemo } from 'react'

type Options = {
  sectionId?: string
  profileSlug?: string
  embedded?: boolean
  displaySettings: VCardDisplaySettings
  onSectionChange?: (sectionId: string) => void
}

export function useProfileSection({
  sectionId = DEFAULT_PROFILE_SECTION,
  profileSlug,
  embedded = false,
  displaySettings,
  onSectionChange,
}: Options) {
  const pathname = usePathname()

  const visibleTabs = useMemo(() => filterNavItemsByVisibility(NAV_BAR_NAV_ITEMS, displaySettings), [displaySettings])

  const resolvedSectionId = useMemo(() => {
    if (!embedded && profileSlug?.trim()) {
      return parseSectionFromPathname(pathname, profileSlug)
    }
    return sectionId
  }, [embedded, profileSlug, pathname, sectionId])

  const activeSectionId = useMemo(() => {
    if (visibleTabs.length === 0) return resolvedSectionId
    return visibleTabs.some((t) => t.id === resolvedSectionId) ? resolvedSectionId : visibleTabs[0].id
  }, [visibleTabs, resolvedSectionId])

  const sectionHref = (tabId: string) => {
    if (embedded || !profileSlug?.trim()) return '#'
    return buildProfileSectionPath(profileSlug, tabId)
  }

  const goToSection = (tabId: string) => {
    if (embedded) {
      onSectionChange?.(tabId)
      return
    }
    // Non-embedded navigation uses <Link href={sectionHref(tabId)} />
  }

  return {
    visibleTabs,
    activeSectionId,
    sectionHref,
    goToSection,
    useLinks: !embedded && Boolean(profileSlug?.trim()),
  }
}
