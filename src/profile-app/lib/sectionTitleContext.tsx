'use client'

import { createContext, useContext, type ReactNode } from 'react'

const SectionTitleContext = createContext('')

export function SectionTitleProvider({ title, children }: { title: string; children: ReactNode }) {
  return <SectionTitleContext.Provider value={title.trim()}>{children}</SectionTitleContext.Provider>
}

/** Prefer the nav tab label (includes builder renames), then API/cache title, then fallback. */
export function useResolvedSectionTitle(apiSectionTitle?: string | null, fallback = 'Section'): string {
  const navTitle = useContext(SectionTitleContext)
  return navTitle || apiSectionTitle?.trim() || fallback
}
