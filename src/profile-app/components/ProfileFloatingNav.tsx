'use client'

import { PublicAnnouncementOverlay } from '@/components/PublicAnnouncementOverlay'
import type { ReactNode } from 'react'

type ProfileFloatingNavProps = {
  theme: 'light' | 'dark'
  children: ReactNode
  /** Editor phone preview — hide public global notices. */
  embedded?: boolean
}

/** Shared v1/v3 floating navbar chrome — colors from theme CSS vars (General → Top navbar). */
export function ProfileFloatingNav({ theme, children, embedded = false }: ProfileFloatingNavProps) {
  const navInnerClass = `vbiz-floating-nav-inner pointer-events-auto relative flex w-full items-center rounded-[14px] border px-2 py-2 backdrop-blur-xl md:rounded-[20px] ${
    theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
  }`

  return (
    <>
      {!embedded ? <PublicAnnouncementOverlay slot="v1v3-mobile" /> : null}

      {/* Mobile bottom fade follows --vbiz-bg so light/dark toggle paints the under-nav area */}
      <div
        aria-hidden
        className="vbiz-nav-bottom-scrim pointer-events-none fixed inset-x-0 bottom-0 z-90 h-28 md:hidden"
      />

      <div className="vbiz-floating-nav pointer-events-none fixed bottom-1 left-0 z-100 w-full px-2 md:top-5 md:bottom-auto md:px-20">
        <div className="relative mx-auto w-full max-w-258">
          <div className={navInnerClass}>
            <div className="min-w-0 flex-1 overflow-visible">{children}</div>
          </div>
          {!embedded ? <PublicAnnouncementOverlay slot="v1v3-under-nav" /> : null}
        </div>
      </div>
    </>
  )
}
