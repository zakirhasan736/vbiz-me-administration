'use client'

import PublicAnnouncementBanner from '@/components/PublicAnnouncementBanner'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import type { CSSProperties, ReactNode } from 'react'

type ProfileFloatingNavProps = {
  theme: 'light' | 'dark'
  children: ReactNode
  /** Editor phone preview — hide public global notices. */
  embedded?: boolean
}

/** Shared v1/v3 floating navbar chrome — scroll handled by Navigation (single overflow container). */
export function ProfileFloatingNav({ theme, children, embedded = false }: ProfileFloatingNavProps) {
  const { pageColors } = useProfileDisplay()
  const navInnerClass = `vbiz-floating-nav-inner pointer-events-auto relative flex w-full items-center rounded-[14px] border px-2 py-2 backdrop-blur-xl md:rounded-[20px] ${
    theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
  }`
  const navInnerStyle: CSSProperties | undefined = pageColors.navBg ? { backgroundColor: pageColors.navBg } : undefined

  return (
    <>
      {/* Mobile: top strip (nav pill is bottom-docked). Same max-width as desktop chrome. */}
      {!embedded ? (
        <div className="pointer-events-none fixed top-3 right-0 left-0 z-100 w-full px-2 md:hidden">
          <div className="mx-auto w-full max-w-258">
            <PublicAnnouncementBanner placement="mobileTop" />
          </div>
        </div>
      ) : null}

      <div className="vbiz-floating-nav pointer-events-none fixed bottom-1 left-0 z-100 w-full px-2 md:top-5 md:bottom-auto md:px-20">
        <div className="mx-auto flex w-full max-w-258 flex-col gap-2">
          <div className={navInnerClass} style={navInnerStyle}>
            <div className="min-w-0 flex-1 overflow-hidden">{children}</div>
          </div>
          {/* Desktop: notice under the pill, matching nav width */}
          {!embedded ? (
            <div className="hidden md:block">
              <PublicAnnouncementBanner placement="chrome" />
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
