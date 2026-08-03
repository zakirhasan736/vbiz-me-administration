'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'

/** Accent color from resolved profile design — used across all shared section layouts. */
export function useSectionAccent(fallback = '#eed677') {
  const { design } = useProfileDisplay()
  return design?.accentColor ?? fallback
}
