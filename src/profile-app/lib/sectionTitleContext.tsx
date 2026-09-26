'use client'

import { getTabSectionMetaEntry, resolveSectionBanner, type ResolvedSectionBanner } from '@/lib/vcardTabSectionMeta'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { createContext, useContext, type ReactNode } from 'react'

type SectionTitleContextValue = {
  tabId: string
  navTitle: string
}

const SectionTitleContext = createContext<SectionTitleContextValue>({ tabId: '', navTitle: '' })

export function SectionTitleProvider({
  title,
  tabId = '',
  children,
}: {
  title: string
  tabId?: string
  children: ReactNode
}) {
  return (
    <SectionTitleContext.Provider value={{ tabId: tabId.trim(), navTitle: title.trim() }}>
      {children}
    </SectionTitleContext.Provider>
  )
}

/** Prefer the nav tab label (includes builder renames), then API/cache title, then fallback. */
export function useResolvedSectionTitle(apiSectionTitle?: string | null, fallback = 'Section'): string {
  const { navTitle } = useContext(SectionTitleContext)
  return navTitle || apiSectionTitle?.trim() || fallback
}

export function useSectionBanner(options?: {
  fallbackTitle?: string | null
  fallbackDescription?: string | null
}): ResolvedSectionBanner {
  const { tabId, navTitle } = useContext(SectionTitleContext)
  const { tabSectionMeta } = useProfileDisplay()
  return resolveSectionBanner({
    tabId,
    tabName: navTitle || options?.fallbackTitle || '',
    meta: getTabSectionMetaEntry(tabSectionMeta, tabId),
    fallbackDescription: options?.fallbackDescription,
  })
}
