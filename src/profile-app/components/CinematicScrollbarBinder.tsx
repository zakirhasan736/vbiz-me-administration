'use client'

import { useCinematicScrollbarBinder } from '@/profile-app/hooks/useCinematicScrollbarBinder'

/** Mount once per profile page — toggles `data-vbiz-scrollbar-active` on scroll areas. */
export function CinematicScrollbarBinder() {
  useCinematicScrollbarBinder()
  return null
}
