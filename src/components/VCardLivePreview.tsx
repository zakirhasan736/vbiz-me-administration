'use client'

import { useLivePreview } from '@/components/vcard/LivePreviewProvider'
import { usePreviewPhoneScroll } from '@/hooks/usePreviewPhoneScroll'
import { cn } from '@/utils/cn'
import { ChevronRight, Moon, Sun, X } from 'lucide-react'
import { motion, useReducedMotion } from 'motion/react'
import dynamic from 'next/dynamic'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'

const NARROW_VIEWPORT_QUERY = '(max-width: 767px)'
const POSITION_STORAGE_KEY = 'vbiz_live_preview_offset'
const COLLAPSED_STORAGE_KEY = 'vbiz_live_preview_collapsed'
/** Visible strip left on screen when the phone is docked to the right edge. */
const COLLAPSED_RAIL = '3rem'

/** `public/iPhoneAir.png` is 920×1920. Insets and island box were measured from the asset. */
const IPHONE_SCREEN_INSET = { top: '2.15%', right: '4.35%', bottom: '2.15%', left: '4.35%' } as const
const IPHONE_ISLAND_GRAB = { top: '4.635%', left: '36.522%', width: '26.957%', height: '3.698%' } as const

/** Bezel + Dynamic Island hit targets so the glass stays interactive. */
const FRAME_GRAB_HITS = [
  { key: 'top', className: 'inset-x-0 top-0', style: { height: IPHONE_SCREEN_INSET.top } },
  { key: 'bottom', className: 'inset-x-0 bottom-0', style: { height: IPHONE_SCREEN_INSET.bottom } },
  { key: 'left', className: 'inset-y-0 left-0', style: { width: IPHONE_SCREEN_INSET.left } },
  { key: 'right', className: 'inset-y-0 right-0', style: { width: IPHONE_SCREEN_INSET.right } },
  { key: 'island', className: '', style: IPHONE_ISLAND_GRAB },
] as const

const PREVIEW_OPEN_TRANSITION = { type: 'spring' as const, stiffness: 380, damping: 32, mass: 0.72 }
const PREVIEW_CLOSE_TRANSITION = { duration: 0.42, ease: [0.32, 0.08, 0.24, 1] as const }
const PREVIEW_UNMOUNT_MS = 450

type Offset = { x: number; y: number }

const ZERO_OFFSET: Offset = { x: 0, y: 0 }

function readStoredOffset(): Offset {
  try {
    const raw = localStorage.getItem(POSITION_STORAGE_KEY)
    if (!raw) return ZERO_OFFSET
    const parsed = JSON.parse(raw) as Partial<Offset>
    if (typeof parsed?.x !== 'number' || typeof parsed?.y !== 'number') return ZERO_OFFSET
    return { x: parsed.x, y: parsed.y }
  } catch {
    return ZERO_OFFSET
  }
}

function readStoredCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSED_STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

function clamp(value: number, min: number, max: number): number {
  if (max < min) return 0
  return Math.min(Math.max(value, min), max)
}

function useIsNarrowViewport(): boolean {
  const subscribe = useCallback((onChange: () => void) => {
    const mq = window.matchMedia(NARROW_VIEWPORT_QUERY)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(NARROW_VIEWPORT_QUERY).matches,
    () => false
  )
}

function PreviewBootFallback() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#020914] text-zinc-400">
      <div className="h-12 w-12 animate-pulse rounded-full bg-white/10" />
      <p className="text-[10px] font-semibold tracking-[0.18em] uppercase">Loading preview</p>
    </div>
  )
}

const LivePreviewProfile = dynamic(() => import('@/components/vcard/LivePreviewProfile'), {
  ssr: false,
  loading: PreviewBootFallback,
})

export function VCardLivePreview() {
  const isNarrowViewport = useIsNarrowViewport()
  if (isNarrowViewport) return null
  return <VCardLivePreviewDesktop />
}

function VCardLivePreviewDesktop() {
  const { isOpen, close } = useLivePreview()
  const reduceMotion = useReducedMotion()
  const phoneRef = useRef<HTMLDivElement>(null)
  const { scrollRef } = usePreviewPhoneScroll<HTMLDivElement>()
  const [previewTheme, setPreviewTheme] = useState<'light' | 'dark'>('dark')
  const [sessionLive, setSessionLive] = useState(false)
  const [offset, setOffset] = useState<Offset>(() => (typeof window === 'undefined' ? ZERO_OFFSET : readStoredOffset()))
  const [isCollapsed, setStoredCollapsed] = useState(() =>
    typeof window === 'undefined' ? false : readStoredCollapsed()
  )
  const [isDragging, setIsDragging] = useState(false)
  const offsetRef = useRef(offset)

  if (isOpen && !sessionLive) {
    setSessionLive(true)
  }

  useEffect(() => {
    offsetRef.current = offset
  }, [offset])

  /** Keep the phone content through the close animation, then drop the profile tree. */
  useEffect(() => {
    if (isOpen || !sessionLive) return
    const ms = reduceMotion ? 180 : PREVIEW_UNMOUNT_MS
    const timer = window.setTimeout(() => setSessionLive(false), ms)
    return () => window.clearTimeout(timer)
  }, [isOpen, reduceMotion, sessionLive])

  useEffect(() => {
    if (!isOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, close])

  /** A shrinking viewport must not park the phone off-screen. */
  useEffect(() => {
    if (isCollapsed) return
    const onResize = () => {
      const el = phoneRef.current
      const current = offsetRef.current
      if (!el || (current.x === 0 && current.y === 0)) return
      const rect = el.getBoundingClientRect()
      const anchorLeft = rect.left - current.x
      const anchorTop = rect.top - current.y
      const margin = 12
      const next = {
        x: clamp(current.x, margin - anchorLeft, window.innerWidth - margin - rect.width - anchorLeft),
        y: clamp(current.y, margin - anchorTop, window.innerHeight - margin - rect.height - anchorTop),
      }
      if (next.x !== current.x || next.y !== current.y) setOffset(next)
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [isCollapsed])

  /** Drag bounds are captured on pointer down so moves never depend on a committed render. */
  const dragRef = useRef<{
    pointerId: number
    startX: number
    startY: number
    origin: Offset
    minX: number
    maxX: number
    minY: number
    maxY: number
    last: Offset
  } | null>(null)

  const onHandlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLElement>) => {
      const el = phoneRef.current
      if (event.button !== 0 || !el || isCollapsed) return
      event.currentTarget.setPointerCapture(event.pointerId)

      const origin = offsetRef.current
      const rect = el.getBoundingClientRect()
      const anchorLeft = rect.left - origin.x
      const anchorTop = rect.top - origin.y
      const margin = 12

      dragRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        origin,
        minX: margin - anchorLeft,
        maxX: window.innerWidth - margin - rect.width - anchorLeft,
        minY: margin - anchorTop,
        maxY: window.innerHeight - margin - rect.height - anchorTop,
        last: origin,
      }
      setIsDragging(true)
    },
    [isCollapsed]
  )

  const onHandlePointerMove = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return

    const next = {
      x: clamp(drag.origin.x + (event.clientX - drag.startX), drag.minX, drag.maxX),
      y: clamp(drag.origin.y + (event.clientY - drag.startY), drag.minY, drag.maxY),
    }
    drag.last = next
    setOffset(next)
  }, [])

  const endDrag = useCallback((event: React.PointerEvent<HTMLElement>) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    dragRef.current = null
    setIsDragging(false)
    try {
      localStorage.setItem(POSITION_STORAGE_KEY, JSON.stringify(drag.last))
    } catch {
      /* ignore */
    }
  }, [])

  const setCollapsed = useCallback((next: boolean) => {
    setStoredCollapsed(next)
    try {
      localStorage.setItem(COLLAPSED_STORAGE_KEY, next ? '1' : '0')
    } catch {
      /* ignore */
    }
  }, [])

  /**
   * Minimize always returns to the default right-edge dock, not a slide from the
   * current drag offset. Expand restores the last dragged position.
   */
  const visualOffset = isCollapsed ? ZERO_OFFSET : offset
  const collapseShift = isCollapsed ? ` + (100% - ${COLLAPSED_RAIL} + var(--preview-dock-inset, 1.5rem))` : ''
  const phoneTransform = `translate3d(calc(${visualOffset.x}px${collapseShift}), ${visualOffset.y}px, 0)`

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-100 flex items-center"
      initial={false}
      style={{ originX: 0.9, originY: 0.72 }}
      animate={
        isOpen
          ? { opacity: 1, x: 0, y: 0, scale: 1, visibility: 'visible' as const }
          : {
              opacity: 0,
              x: reduceMotion ? 0 : 72,
              y: 0,
              scale: reduceMotion ? 1 : 0.96,
              visibility: 'hidden' as const,
            }
      }
      transition={
        reduceMotion
          ? { duration: 0.18, ease: 'easeOut', visibility: { duration: 0, delay: isOpen ? 0 : 0.18 } }
          : isOpen
            ? { ...PREVIEW_OPEN_TRANSITION, visibility: { duration: 0 } }
            : { ...PREVIEW_CLOSE_TRANSITION, visibility: { duration: 0, delay: 0.42 } }
      }
      inert={!isOpen}
      aria-hidden={!isOpen}
    >
      {/* Dock owns the position and drag transform so chrome can sit outside the phone. */}
      <div
        style={{ transform: phoneTransform }}
        className={cn(
          'pointer-events-none relative z-100 flex min-w-0 flex-col',
          'fixed right-6 bottom-16 aspect-920/1920 h-[min(800px,calc(100dvh-5.5rem))] max-h-[calc(100dvh-5.5rem)] w-auto [--preview-dock-inset:1.5rem] md:right-8 md:bottom-20 md:[--preview-dock-inset:2rem]',
          isDragging
            ? 'duration-0'
            : 'transform-gpu transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]'
        )}
      >
        {/* Close sits outside the bezel, on the phone's top-left corner. */}
        <h2 id="vbiz-live-preview-title" className="sr-only">
          Live profile preview
        </h2>
        <button
          type="button"
          id="vbiz-live-preview-close"
          onClick={close}
          aria-label="Close preview"
          title="Close preview (Esc)"
          className={cn(
            'pointer-events-auto absolute -top-2 -left-4 z-110 flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/70 bg-white text-slate-700 shadow-[0_8px_20px_-6px_rgba(0,0,0,0.45)] transition-[color,background-color,border-color,opacity,transform] hover:border-rose-300 hover:bg-rose-50 hover:text-rose-600 dark:border-white/15 dark:bg-[#0b0f19] dark:text-zinc-100 dark:hover:border-rose-500/40 dark:hover:bg-rose-500/20 dark:hover:text-rose-300',
            isCollapsed && 'pointer-events-none scale-90 opacity-0'
          )}
        >
          <X className="h-4.5 w-4.5" />
        </button>

        {/* Minimize/expand handle sits outside the bezel so it is not clipped by the phone. */}
        <button
          type="button"
          onClick={() => setCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? 'Expand live preview' : 'Minimize preview to the edge'}
          title={isCollapsed ? 'Expand live preview' : 'Minimize preview'}
          className={cn(
            'pointer-events-auto absolute top-1/2 z-110 flex h-24 w-12 -translate-y-1/2 items-center justify-center rounded-2xl border border-slate-200 bg-white/95 text-slate-600 shadow-lg backdrop-blur',
            'transition-[left,border-radius,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
            'hover:text-slate-900 dark:border-white/10 dark:bg-[#0b0f19]/95 dark:text-slate-300 dark:hover:text-white',
            isCollapsed ? 'left-0 rounded-r-none border-r-0 shadow-[0_10px_28px_-8px_rgba(15,23,42,0.45)]' : '-left-8'
          )}
        >
          <ChevronRight
            className={cn(
              'h-5 w-5 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
              isCollapsed && 'rotate-180'
            )}
          />
        </button>

        <div ref={phoneRef} className="pointer-events-auto relative h-full w-full min-w-0 overflow-visible">
          <div
            className={cn(
              'vbiz-preview-phone vbiz-preview-phone--iphone absolute z-10 flex flex-col overflow-hidden rounded-[2.75rem]',
              previewTheme === 'light' ? 'bg-white' : 'bg-[#020914]'
            )}
            style={IPHONE_SCREEN_INSET}
            role="dialog"
            aria-modal={false}
            aria-labelledby="vbiz-live-preview-title"
            aria-describedby="vbiz-live-preview-close"
          >
            <div className="absolute top-1.5 right-3 z-50 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setPreviewTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
                aria-label={previewTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200/60 bg-white/90 text-slate-700 shadow-md backdrop-blur-md transition-colors hover:bg-white dark:border-white/15 dark:bg-zinc-900/90 dark:text-zinc-100 dark:hover:bg-zinc-800"
              >
                {previewTheme === 'dark' ? <Sun className="h-4.5 w-4.5" /> : <Moon className="h-4.5 w-4.5" />}
              </button>
            </div>

            <div
              ref={scrollRef}
              tabIndex={isCollapsed ? -1 : 0}
              role="region"
              aria-label="Mobile profile preview. Scroll to explore the card."
              className={cn(
                'vbiz-preview-frame no-scrollbar isolate flex h-full min-h-0 flex-1 transform-[translateZ(0)] flex-col overflow-x-hidden overflow-y-auto overscroll-contain pt-0',
                isCollapsed && 'pointer-events-none'
              )}
            >
              {sessionLive ? (
                <LivePreviewProfile
                  previewTheme={previewTheme}
                  onPreviewThemeChange={setPreviewTheme}
                  previewActive={isOpen && !isCollapsed}
                />
              ) : null}
            </div>
          </div>

          <img
            src="/iPhoneAir.png"
            alt=""
            draggable={false}
            className="pointer-events-none absolute inset-0 z-40 h-full w-full transform-[translateZ(0)] object-contain select-none"
          />
          {FRAME_GRAB_HITS.map((hit) => (
            <div
              key={hit.key}
              role={hit.key === 'island' ? 'button' : 'presentation'}
              tabIndex={hit.key === 'island' && !isCollapsed ? 0 : undefined}
              aria-label={hit.key === 'island' ? 'Drag to move the preview' : undefined}
              title="Drag to move the preview"
              onPointerDown={onHandlePointerDown}
              onPointerMove={onHandlePointerMove}
              onPointerUp={endDrag}
              onPointerCancel={endDrag}
              className={cn(
                'absolute z-50 touch-none bg-transparent',
                hit.className,
                isCollapsed ? 'pointer-events-none' : 'pointer-events-auto',
                isDragging ? 'cursor-grabbing' : 'cursor-grab'
              )}
              style={hit.style}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
