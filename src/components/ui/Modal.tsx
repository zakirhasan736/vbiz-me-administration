'use client'

import { ModalPortal } from '@/components/ModalPortal'
import { cn } from '@/utils/cn'
import { useEffect, type MouseEvent, type ReactNode } from 'react'

type ModalProps = {
  open?: boolean
  onClose?: () => void
  children: ReactNode
  /** Applied to the dialog panel */
  className?: string
  /** Applied to the full-screen overlay */
  overlayClassName?: string
  closeOnOverlayClick?: boolean
  closeOnEscape?: boolean
  /** When true, ignores overlay / Escape close handlers */
  preventClose?: boolean
  labelledBy?: string
  describedBy?: string
}

export function Modal({
  open = true,
  onClose,
  children,
  className,
  overlayClassName,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  preventClose = false,
  labelledBy,
  describedBy,
}: ModalProps) {
  useEffect(() => {
    if (!open || !closeOnEscape || preventClose || !onClose) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, closeOnEscape, preventClose, onClose])

  useEffect(() => {
    if (!open) return

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [open])

  if (!open) return null

  const handleOverlayClick = () => {
    if (closeOnOverlayClick && !preventClose) onClose?.()
  }

  const stopPropagation = (event: MouseEvent) => {
    event.stopPropagation()
  }

  return (
    <ModalPortal>
      <div
        className={cn(
          'animate-in fade-in fixed inset-0 z-200 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm duration-200 dark:bg-black/60',
          overlayClassName
        )}
        onClick={handleOverlayClick}
        role="presentation"
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          aria-describedby={describedBy}
          className={cn(
            'animate-in zoom-in-95 w-full max-w-sm rounded-[28px] border border-slate-200 bg-white shadow-2xl duration-200 dark:border-white/10 dark:bg-[#0b0f19]',
            className
          )}
          onClick={stopPropagation}
        >
          {children}
        </div>
      </div>
    </ModalPortal>
  )
}
