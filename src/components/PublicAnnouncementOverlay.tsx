'use client'

import PublicAnnouncementBanner from '@/components/PublicAnnouncementBanner'

type OverlaySlot = 'v1v3-mobile' | 'v1v3-under-nav' | 'v2-under-nav'

type PublicAnnouncementOverlayProps = {
  slot: OverlaySlot
}

/**
 * Floating public notice. Never participates in document flow.
 *
 * v1 / v3
 *  - mobile: top of the screen (nav is bottom-docked)
 *  - desktop: immediately under the top nav pill
 * v2
 *  - all widths: immediately under the sticky top tabs
 */
export function PublicAnnouncementOverlay({ slot }: PublicAnnouncementOverlayProps) {
  if (slot === 'v2-under-nav') {
    return (
      <div className="vbiz-public-announcement-overlay vbiz-public-announcement-overlay--v2 pointer-events-none fixed inset-x-0 z-40 px-3 sm:px-8">
        <div className="mx-auto w-full max-w-258">
          <PublicAnnouncementBanner placement="chrome" />
        </div>
      </div>
    )
  }

  if (slot === 'v1v3-mobile') {
    return (
      <div className="vbiz-public-announcement-overlay vbiz-public-announcement-overlay--v1v3-mobile pointer-events-none fixed inset-x-0 top-0 z-100 px-2 pt-[max(0.5rem,env(safe-area-inset-top,0px))] md:hidden">
        <div className="mx-auto w-full max-w-258">
          <PublicAnnouncementBanner placement="mobileTop" />
        </div>
      </div>
    )
  }

  return (
    <div className="vbiz-public-announcement-overlay vbiz-public-announcement-overlay--v1v3-desktop pointer-events-none absolute top-full right-0 left-0 z-10 mt-2 hidden md:block">
      <PublicAnnouncementBanner placement="chrome" />
    </div>
  )
}
