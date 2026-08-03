'use client'

import type { CardThemeConfig } from '@/lib/theme/cardThemeContract'
import { createContext, useContext, type ReactNode } from 'react'

type ProfileThemeContextValue = {
  themeConfig: CardThemeConfig
  fromApi: boolean
}

const ProfileThemeContext = createContext<ProfileThemeContextValue | null>(null)

export function ProfileThemeProvider({
  themeConfig,
  fromApi,
  children,
}: {
  themeConfig: CardThemeConfig
  fromApi: boolean
  children: ReactNode
}) {
  return <ProfileThemeContext.Provider value={{ themeConfig, fromApi }}>{children}</ProfileThemeContext.Provider>
}

export function useProfileTheme(): ProfileThemeContextValue | null {
  return useContext(ProfileThemeContext)
}
