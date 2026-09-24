'use client'

import { PUBLIC_MODAL_INSET_X, PUBLIC_MODAL_INSET_Y } from '@/profile-app/lib/publicModalLayout'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useSyncExternalStore, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

function getPortalTarget(): HTMLElement | null {
  if (typeof document === 'undefined') return null
  return document.body
}

function subscribePortalTarget() {
  return () => {}
}

type V1BottomSheetProps = {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  /** Panel width / rounding classes applied to the sliding sheet. */
  panelClassName?: string
}

/** v1 popup shell — centered with ~10% top/bottom safe space above all profile UI. */
export function V1BottomSheet({ isOpen, onClose, children, panelClassName }: V1BottomSheetProps) {
  const portalTarget = useSyncExternalStore(subscribePortalTarget, getPortalTarget, () => null)

  useEffect(() => {
    if (!isOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  if (!portalTarget) return null

  return createPortal(
    <AnimatePresence>
      {isOpen ? (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            onClick={onClose}
            className="pointer-events-auto fixed inset-0 z-9998 bg-black/75 backdrop-blur-md"
            aria-hidden
          />
          <div
            className={`pointer-events-none fixed inset-0 z-9999 flex items-center justify-center ${PUBLIC_MODAL_INSET_X} ${PUBLIC_MODAL_INSET_Y}`}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 24 }}
              transition={{ type: 'spring', damping: 30, stiffness: 350, mass: 0.8 }}
              onClick={(e) => e.stopPropagation()}
              className={`pointer-events-auto max-h-[90dvh] w-full overflow-x-hidden overflow-y-auto overscroll-contain sm:max-w-[440px] ${panelClassName ?? ''}`}
            >
              {children}
            </motion.div>
          </div>
        </>
      ) : null}
    </AnimatePresence>,
    portalTarget
  )
}
