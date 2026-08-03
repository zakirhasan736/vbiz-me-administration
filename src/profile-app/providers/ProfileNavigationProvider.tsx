'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { mapNavBarLinks } from '@/lib/api/navbar/mapNavBarLinks'
import { orderAndDedupeNavItems } from '@/lib/api/navbar/orderNavTabs'
import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import { getNavItemById, type NavBarNavItem } from '@/lib/vcardNavbar'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetNavBarLinksQuery } from '@/redux/api'
import { navBarLinksApi } from '@/redux/features/navbar/navbar.api'
import { createContext, useCallback, useContext, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'

type ProfileNavigationContextValue = {
  navItems: NavBarNavItem[]
  visibleTabs: NavBarNavItem[]
  activeSectionId: string
  goToSection: (tabId: string) => void
  getNavItem: (tabId: string) => NavBarNavItem | undefined
  isNavLoading: boolean
}

const ProfileNavigationContext = createContext<ProfileNavigationContextValue | null>(null)

function resolveActiveSection(sectionId: string, visibleTabs: NavBarNavItem[]): string {
  if (visibleTabs.length === 0) return sectionId
  return visibleTabs.some((t) => t.id === sectionId) ? sectionId : visibleTabs[0].id
}

type Props = {
  children: ReactNode
  sectionId?: string
  onSectionChange?: (sectionId: string) => void
  /** Server-prefetched `/post-types?profile_id=` — backend returns only tabs with data. */
  initialNavBarLinks?: NavBarLinksData | null
}

/**
 * Client-side section nav — no URL / route changes.
 * Tab list comes from `GET /post-types?profile_id=` (backend filters empty sections).
 */
export function ProfileNavigationProvider({
  children,
  sectionId = DEFAULT_PROFILE_SECTION,
  onSectionChange,
  initialNavBarLinks = null,
}: Props) {
  const dispatch = useAppDispatch()
  const { settings: displaySettings, cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''

  const hasPrefetchedNavLinks = Boolean(initialNavBarLinks)

  useLayoutEffect(() => {
    if (!initialNavBarLinks || !profileId) return
    dispatch(navBarLinksApi.util.upsertQueryData('getNavBarLinks', profileId, initialNavBarLinks))
  }, [dispatch, initialNavBarLinks, profileId])

  const {
    data: navBarLinksFromQuery,
    isLoading: isNavLinksLoading,
    isError: isNavError,
  } = useGetNavBarLinksQuery(profileId, { skip: !profileId || hasPrefetchedNavLinks })

  const navBarLinks = initialNavBarLinks ?? navBarLinksFromQuery

  const navItems = useMemo(() => {
    if (isNavError || !navBarLinks) return []
    return mapNavBarLinks(navBarLinks)
  }, [navBarLinks, isNavError])

  const visibleTabs = useMemo(() => {
    if (!displaySettings.globalEnabled) return []
    return orderAndDedupeNavItems(navItems)
  }, [displaySettings.globalEnabled, navItems])

  const isNavLoading = hasPrefetchedNavLinks ? false : isNavLinksLoading

  const getNavItem = useCallback((tabId: string) => getNavItemById(tabId, navItems), [navItems])

  const [localSectionId, setLocalSectionId] = useState<string | null>(null)
  const [prevSectionId, setPrevSectionId] = useState(sectionId)

  if (sectionId !== prevSectionId) {
    setPrevSectionId(sectionId)
    setLocalSectionId(null)
  }

  const activeSectionId = resolveActiveSection(localSectionId ?? sectionId, visibleTabs)

  const goToSection = useCallback(
    (tabId: string) => {
      const nextId = resolveActiveSection(tabId, visibleTabs)
      setLocalSectionId(nextId)
      onSectionChange?.(nextId)
    },
    [onSectionChange, visibleTabs]
  )

  const value = useMemo<ProfileNavigationContextValue>(
    () => ({
      navItems,
      visibleTabs,
      activeSectionId,
      goToSection,
      getNavItem,
      isNavLoading,
    }),
    [navItems, visibleTabs, activeSectionId, goToSection, getNavItem, isNavLoading]
  )

  return <ProfileNavigationContext.Provider value={value}>{children}</ProfileNavigationContext.Provider>
}

export function useProfileNavigation(): ProfileNavigationContextValue {
  const ctx = useContext(ProfileNavigationContext)
  if (!ctx) {
    throw new Error('useProfileNavigation must be used within ProfileNavigationProvider')
  }
  return ctx
}
