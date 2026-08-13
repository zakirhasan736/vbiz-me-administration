'use client'

import { cn } from '@/utils/cn'
import { MoreHorizontal, Settings, Trash2 } from 'lucide-react'
import { useEffect, useId, useRef } from 'react'

type VCardOverflowMenuProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onDelete: () => void
  onSettings?: () => void
  isDeleting?: boolean
  actionsDisabled?: boolean
  actionsDisabledReason?: string
  cardRef: React.RefObject<HTMLElement | null>
}

export function VCardOverflowMenu({
  open,
  onOpenChange,
  onDelete,
  onSettings,
  isDeleting,
  actionsDisabled,
  actionsDisabledReason,
  cardRef,
}: VCardOverflowMenuProps) {
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handlePointerOutside(event: MouseEvent | TouchEvent) {
      const target = event.target as Node
      if (cardRef.current?.contains(target)) return
      onOpenChange(false)
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onOpenChange(false)
        triggerRef.current?.focus()
      }
    }

    document.addEventListener('mousedown', handlePointerOutside)
    document.addEventListener('touchstart', handlePointerOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerOutside)
      document.removeEventListener('touchstart', handlePointerOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onOpenChange, cardRef])

  useEffect(() => {
    if (open) {
      const firstItem = menuRef.current?.querySelector<HTMLElement>('[role="menuitem"]')
      firstItem?.focus()
    }
  }, [open])

  return (
    <div className="absolute top-2.5 right-2.5 z-20">
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          onOpenChange(!open)
        }}
        className={cn(
          'flex h-7 w-7 items-center justify-center rounded-md border border-slate-200/60 bg-white/90 text-slate-400 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 focus:opacity-100 dark:border-white/10 dark:bg-black/50',
          open && 'opacity-100'
        )}
        aria-label="Card actions"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
      >
        <MoreHorizontal className="h-3.5 w-3.5" />
      </button>
      {open ? (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          aria-label="Card actions"
          className="absolute top-9 right-0 min-w-40 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-white/10 dark:bg-[#0b0f19]"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            role="menuitem"
            disabled={isDeleting || actionsDisabled}
            title={actionsDisabled ? actionsDisabledReason : undefined}
            onClick={(e) => {
              e.stopPropagation()
              if (actionsDisabled) return
              onOpenChange(false)
              onDelete()
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-rose-600 hover:bg-rose-50 focus:bg-rose-50 focus:outline-none disabled:opacity-50 dark:text-rose-400 dark:hover:bg-rose-500/10 dark:focus:bg-rose-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
            Delete card
          </button>
          {onSettings ? (
            <button
              type="button"
              role="menuitem"
              onClick={(e) => {
                e.stopPropagation()
                if (actionsDisabled) return
                onOpenChange(false)
                onSettings()
              }}
              disabled={actionsDisabled}
              title={actionsDisabled ? actionsDisabledReason : undefined}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-[13px] font-semibold text-slate-700 hover:bg-slate-50 focus:bg-slate-50 focus:outline-none disabled:opacity-50 dark:text-slate-200 dark:hover:bg-white/5 dark:focus:bg-white/5"
            >
              <Settings className="h-3.5 w-3.5" aria-hidden />
              Settings
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
