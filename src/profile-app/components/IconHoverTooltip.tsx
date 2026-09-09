'use client'

import { cn } from '@/utils/cn'
import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

function subscribeToMounted() {
  return () => {}
}

function getClientMounted() {
  return true
}

function getServerMounted() {
  return false
}

const TOOLTIP_CLASS =
  'pointer-events-none z-200 rounded-lg border border-zinc-200 bg-zinc-900 px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap text-white shadow-sm dark:border-zinc-700 dark:bg-zinc-100 dark:text-zinc-900'

const PLACEMENT_CLASS = {
  left: 'top-1/2 right-full mr-2 -translate-y-1/2',
  right: 'top-1/2 left-full ml-2 -translate-y-1/2',
  top: 'bottom-full left-1/2 mb-2 -translate-x-1/2',
  bottom: 'top-full left-1/2 mt-2 -translate-x-1/2',
} as const

export type IconHoverTooltipPlacement = keyof typeof PLACEMENT_CLASS

type IconHoverTooltipProps = {
  label: string
  children: ReactNode
  placement?: IconHoverTooltipPlacement
  className?: string
  /**
   * Render tooltip in a document portal with fixed coords.
   * Use inside overflow-clipped parents (e.g. floating nav scroll).
   */
  portal?: boolean
}

function portalStyle(rect: DOMRect, placement: IconHoverTooltipPlacement): CSSProperties {
  const gap = 2
  const midX = rect.left + rect.width / 2
  const midY = rect.top + rect.height / 2

  switch (placement) {
    case 'left':
      return { top: midY, left: rect.left - gap, transform: 'translate(-100%, -50%)' }
    case 'right':
      return { top: midY, left: rect.right + gap, transform: 'translate(0, -50%)' }
    case 'bottom':
      return { top: rect.bottom + gap, left: midX, transform: 'translate(-50%, 0)' }
    case 'top':
    default:
      return { top: rect.top - gap, left: midX, transform: 'translate(-50%, -100%)' }
  }
}

/** Hover chip matching Share / Notes / certifications tooltips on the public home page. */
export function IconHoverTooltip({
  label,
  children,
  placement = 'top',
  className,
  portal = false,
}: IconHoverTooltipProps) {
  const tooltipId = useId()
  const triggerRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState<DOMRect | null>(null)
  const mounted = useSyncExternalStore(subscribeToMounted, getClientMounted, getServerMounted)

  const syncCoords = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    setCoords(el.getBoundingClientRect())
  }, [])

  useLayoutEffect(() => {
    if (!portal || !open) return
    syncCoords()
    window.addEventListener('scroll', syncCoords, true)
    window.addEventListener('resize', syncCoords)
    return () => {
      window.removeEventListener('scroll', syncCoords, true)
      window.removeEventListener('resize', syncCoords)
    }
  }, [portal, open, syncCoords])

  if (!portal) {
    return (
      <span className={cn('group/tip relative inline-flex', className)}>
        {children}
        <span
          role="tooltip"
          className={cn(
            'absolute opacity-0 transition-opacity duration-150 group-hover/tip:opacity-100',
            TOOLTIP_CLASS,
            PLACEMENT_CLASS[placement]
          )}
        >
          {label}
        </span>
      </span>
    )
  }

  const show = open && coords && mounted

  return (
    <span
      ref={triggerRef}
      className={cn('relative inline-flex', className)}
      onMouseEnter={() => {
        syncCoords()
        setOpen(true)
      }}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => {
        syncCoords()
        setOpen(true)
      }}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={show ? tooltipId : undefined}>{children}</span>
      {show
        ? createPortal(
            <span
              id={tooltipId}
              role="tooltip"
              className={cn('fixed transition-opacity duration-150', TOOLTIP_CLASS)}
              style={portalStyle(coords, placement)}
            >
              {label}
            </span>,
            document.body
          )
        : null}
    </span>
  )
}
