'use client'

import { googleFontsCssHref, resolveGoogleFontFamily } from '@/lib/fonts'
import { useEffect } from 'react'

/**
 * Injects a Google Fonts stylesheet for the active card typography.
 * Safe to call with preset ids or custom Google family names.
 */
export function useGoogleFont(fontFamilyId: string | null | undefined) {
  useEffect(() => {
    if (typeof document === 'undefined') return
    const family = resolveGoogleFontFamily(fontFamilyId)
    if (!family) return

    const linkId = `vbiz-gf-${family.replace(/\s+/g, '-')}`
    if (document.getElementById(linkId)) return

    const link = document.createElement('link')
    link.id = linkId
    link.rel = 'stylesheet'
    link.href = googleFontsCssHref(family)
    document.head.appendChild(link)
  }, [fontFamilyId])
}

/** Prefetch several families (e.g. typography preset grid). */
export function useGoogleFonts(fontFamilyIds: Array<string | null | undefined>) {
  const key = fontFamilyIds.filter(Boolean).join('|')
  useEffect(() => {
    if (typeof document === 'undefined') return
    const ids = key ? key.split('|') : []
    for (const id of ids) {
      const family = resolveGoogleFontFamily(id)
      if (!family) continue
      const linkId = `vbiz-gf-${family.replace(/\s+/g, '-')}`
      if (document.getElementById(linkId)) continue
      const link = document.createElement('link')
      link.id = linkId
      link.rel = 'stylesheet'
      link.href = googleFontsCssHref(family)
      document.head.appendChild(link)
    }
  }, [key])
}
