'use client'

import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { useCallback, useEffect, useState } from 'react'

type UseProfileThemeOptions = {
  design: ResolvedProfileDesign
  embedded?: boolean
  previewTheme?: 'light' | 'dark'
  onPreviewThemeChange?: (theme: 'light' | 'dark') => void
  /** Fallback when localStorage has no saved theme. */
  defaultTheme?: 'light' | 'dark'
  bodyClassNames: { dark: string; light: string }
  /** v3: follow OS theme when user has not picked a theme. */
  syncSystemPreference?: boolean
}

export function useProfileTheme({
  design,
  embedded = false,
  previewTheme,
  onPreviewThemeChange,
  defaultTheme,
  bodyClassNames,
  syncSystemPreference = false,
}: UseProfileThemeOptions) {
  const fallback = defaultTheme ?? (design.darkMode ? 'dark' : 'light')

  const [internalTheme, setInternalTheme] = useState<'light' | 'dark'>(() => {
    if (embedded) return design.darkMode ? 'dark' : 'light'
    if (typeof window === 'undefined') return fallback
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null
    if (saved === 'dark' || saved === 'light') return saved
    return fallback
  })

  const theme = embedded && previewTheme !== undefined ? previewTheme : internalTheme

  useEffect(() => {
    if (embedded) return
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
      document.body.className = bodyClassNames.dark
    } else {
      document.documentElement.classList.remove('dark')
      document.body.className = bodyClassNames.light
    }
    localStorage.setItem('theme', theme)
  }, [theme, embedded, bodyClassNames.dark, bodyClassNames.light])

  useEffect(() => {
    if (!syncSystemPreference || embedded || typeof window === 'undefined') return
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setInternalTheme(e.matches ? 'dark' : 'light')
      }
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [syncSystemPreference, embedded])

  const toggleTheme = useCallback(() => {
    const next = theme === 'dark' ? 'light' : 'dark'
    if (embedded && onPreviewThemeChange) {
      onPreviewThemeChange(next)
    } else {
      setInternalTheme(next)
    }
  }, [embedded, onPreviewThemeChange, theme])

  return { theme, toggleTheme, setInternalTheme }
}
