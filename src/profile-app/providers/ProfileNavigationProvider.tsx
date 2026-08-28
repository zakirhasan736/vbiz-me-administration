'use client'

import { useAppDispatch } from '@/hooks/redux'
import type { NavBarLinksData } from '@/interfaces/navbarLinks.interface'
import { mapNavBarLinks } from '@/lib/api/navbar/mapNavBarLinks'
import { DEFAULT_PROFILE_SECTION } from '@/lib/profileRoutes'
import {
  applyNavLabelOverrides,
  getNavItemById,
  LOCKED_NAV_ITEM_IDS,
  mergeCustomNavItems,
  NAV_BAR_NAV_ITEMS,
  selectEnabledNavItems,
  type NavBarNavItem,
} from '@/lib/vcardNavbar'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { preloadProfileSections } from '@/profile-app/sections/preloadProfileSections'
import type { ProfileTemplateVariant } from '@/profile-app/sections/sectionRegistry'
import { useGetNavBarLinksQuery } from '@/redux/api'
import { navBarLinksApi } from '@/redux/features/navbar/navbar.api'
import {
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

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
  /** Server-prefetched `/post-types?profile_id=` — backend returns owner-selected tabs. */
  initialNavBarLinks?: NavBarLinksData | null
}

/**
 * Client-side section nav — no URL / route changes.
 * Visible tabs follow Add Tabs order (`editorNavOrder`), including empty sections.
 */
export function ProfileNavigationProvider({
  children,
  sectionId = DEFAULT_PROFILE_SECTION,
  onSectionChange,
  initialNavBarLinks = null,
}: Props) {
  const dispatch = useAppDispatch()
  const {
    settings: displaySettings,
    cardOwnerId,
    customTabs,
    tabLabelOverrides,
    design,
    embedded,
  } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const template = (design?.profileTemplate as ProfileTemplateVariant | undefined) ?? 'v3'

  const hasPrefetchedNavLinks = Boolean(initialNavBarLinks)

  useLayoutEffect(() => {
    if (!initialNavBarLinks || !profileId) return
    dispatch(navBarLinksApi.util.upsertQueryData('getNavBarLinks', profileId, initialNavBarLinks))
  }, [dispatch, initialNavBarLinks, profileId])

  const {
    data: navBarLinksFromQuery,
    isLoading: isNavLinksLoading,
    isError: isNavError,
  } = useGetNavBarLinksQuery(profileId, {
    skip: !profileId || hasPrefetchedNavLinks || embedded,
  })

  const navBarLinks = initialNavBarLinks ?? navBarLinksFromQuery

  const apiNavItems = useMemo(() => {
    if (isNavError || !navBarLinks) return []
    return mapNavBarLinks(navBarLinks)
  }, [navBarLinks, isNavError])

  const navItems = useMemo(() => {
    const apiById = new Map(apiNavItems.map((item) => [item.id, item]))
    const catalogItems = mergeCustomNavItems(NAV_BAR_NAV_ITEMS, customTabs)
    const mergedCatalogItems = catalogItems.map((item) => {
      const apiItem = apiById.get(item.id)
      return apiItem ? { ...item, apiSectionName: apiItem.apiSectionName ?? item.apiSectionName } : item
    })
    const catalogIds = new Set(mergedCatalogItems.map((item) => item.id))
    const apiOnlyItems = apiNavItems.filter((item) => !catalogIds.has(item.id))
    return applyNavLabelOverrides([...mergedCatalogItems, ...apiOnlyItems], tabLabelOverrides)
  }, [apiNavItems, customTabs, tabLabelOverrides])

  const visibleTabs = useMemo(() => {
    if (!displaySettings.globalEnabled) return []
    if (embedded) return selectEnabledNavItems(navItems, displaySettings)
    if (Array.isArray(displaySettings.editorNavOrder) && displaySettings.editorNavOrder.length) {
      return selectEnabledNavItems(navItems, displaySettings)
    }
    if (apiNavItems.length) {
      const byId = new Map(navItems.map((item) => [item.id, item]))
      return apiNavItems.map((item) => byId.get(item.id) ?? item)
    }
    return selectEnabledNavItems(navItems, displaySettings).filter((item) => LOCKED_NAV_ITEM_IDS.has(item.id))
  }, [apiNavItems, displaySettings, embedded, navItems])

  const isNavLoading = embedded || hasPrefetchedNavLinks ? false : isNavLinksLoading

  // Warm every reachable section chunk so tab switches never suspend.
  useEffect(() => {
    if (!visibleTabs.length) return
    preloadProfileSections(
      visibleTabs.map((tab) => tab.profileContent ?? 'empty'),
      template
    )
  }, [visibleTabs, template])

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
      const apply = () => {
        setLocalSectionId(nextId)
        onSectionChange?.(nextId)
      }
      // Public cards can wait a frame for the next chunk. The editor phone must follow instantly.
      if (embedded) apply()
      else startTransition(apply)
    },
    [embedded, onSectionChange, visibleTabs]
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
