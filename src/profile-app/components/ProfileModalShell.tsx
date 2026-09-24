'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { PUBLIC_MODAL_BACKDROP, PUBLIC_MODAL_PANEL } from '@/profile-app/lib/publicModalLayout'
import { V1BottomSheet } from '@/profile-app/v1/components/V1BottomSheet'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

type ProfileModalShellProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Panel wrapper classes (rounding, border, max-width). Theme surface via `vbiz-modal-panel`. */
  panelClassName?: string
  /** Backdrop container classes for v2/v3 responsive modal. */
  backdropClassName?: string
  backdropId?: string
}

/**
 * Shared popup shell for all profile templates.
 * Always middle-aligned with ~10% top/bottom safe space (max height 80dvh).
 */
export function ProfileModalShell({
  isOpen,
  onClose,
  children,
  panelClassName,
  backdropClassName,
  backdropId,
}: ProfileModalShellProps) {
  const { design } = useProfileDisplay()
  const isV1 = design?.profileTemplate === 'v1'
  const backdrop = backdropClassName || PUBLIC_MODAL_BACKDROP
  const panel = `${PUBLIC_MODAL_PANEL}${panelClassName ? ` ${panelClassName}` : ''}`

  useEffect(() => {
    if (!isOpen || isV1) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen, isV1])

  if (isV1) {
    return (
      <V1BottomSheet isOpen={isOpen} onClose={onClose}>
        <div className={`vbiz-modal-panel ${panel}`}>{children}</div>
      </V1BottomSheet>
    )
  }

  return (
    <AnimatePresence>
      {isOpen ? (
        <div id={backdropId} className={backdrop}>
          <div className="absolute inset-0" onClick={onClose} aria-hidden />
          <motion.div
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
            className={`vbiz-modal-panel relative z-10 w-full ${panel}`}
          >
            {children}
          </motion.div>
        </div>
      ) : null}
    </AnimatePresence>
  )
}
