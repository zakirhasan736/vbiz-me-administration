'use client'

import { useProfileIntro } from '@/profile-app/hooks/useProfileIntro'
import { createContext, useContext, type ReactNode } from 'react'

type IntroContextValue = ReturnType<typeof useProfileIntro>

const ProfileIntroContext = createContext<IntroContextValue | null>(null)

type Props = {
  children: ReactNode
  embedded?: boolean
  profileSlug?: string
  shareSlug?: string
  explainerVideoUrl?: string | null
}

export function ProfileIntroProvider({ children, ...options }: Props) {
  const value = useProfileIntro(options)
  return <ProfileIntroContext.Provider value={value}>{children}</ProfileIntroContext.Provider>
}

export function useProfileIntroContext(): IntroContextValue {
  const ctx = useContext(ProfileIntroContext)
  if (!ctx) {
    throw new Error('useProfileIntroContext must be used within ProfileIntroProvider')
  }
  return ctx
}

export function useProfileIntroContextOptional(): IntroContextValue | null {
  return useContext(ProfileIntroContext)
}
