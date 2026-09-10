'use client'

import type { DragHandleProps } from '@/components/ReorderList'
import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { cn } from '@/utils/cn'
import { ChevronDown, Film, GripVertical, Play, Trash2 } from 'lucide-react'
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react'

type AccentBadge = {
  border: string
  bg: string
  text: string
  chevronOpen?: string
  cardExpandedBorder?: string
}

const defaultAccent: AccentBadge = {
  border: 'border-cyan-100 dark:border-cyan-500/20',
  bg: 'bg-cyan-50 dark:bg-cyan-500/10',
  text: 'text-cyan-600 dark:text-cyan-400',
  chevronOpen: 'text-cyan-500',
  cardExpandedBorder: 'border-cyan-200/60 dark:border-cyan-500/20',
}

const CLICK_DRAG_THRESHOLD_PX = 6

export function expandableCardClassName(isExpanded: boolean, accent: AccentBadge = defaultAccent) {
  return cn(
    'group/card overflow-hidden rounded-4xl border bg-slate-50/50 shadow-sm transition-all dark:bg-white/2',
    isExpanded
      ? (accent.cardExpandedBorder ?? 'border-cyan-200/60 dark:border-cyan-500/20')
      : 'border-transparent hover:border-slate-200/80 hover:bg-slate-50 dark:border-white/5'
  )
}

/** Compact image/video preview for collapsed accordion rows. */
export function EntryAttachmentThumb({ url, className }: { url?: string | null; className?: string }) {
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return null
  const src = encodeMediaUrl(trimmed)
  if (!src) return null

  const video = isVideoUrl(src)
  const embedHost = /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(src)
  const canShowImage = !video && isUsableImageSrc(src)

  return (
    <span
      className={cn(
        'relative h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-slate-200/90 bg-slate-100 shadow-sm dark:border-white/10 dark:bg-white/5',
        className
      )}
      aria-hidden
    >
      {video && embedHost ? (
        <span className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-300">
          <Film className="h-4 w-4" />
        </span>
      ) : video ? (
        <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
      ) : canShowImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- tiny editor preview; arbitrary remote URLs
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-slate-400">
          <Film className="h-4 w-4" />
        </span>
      )}
      {video ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/25">
          <Play className="h-3.5 w-3.5 fill-white text-white" />
        </span>
      ) : null}
    </span>
  )
}

type ExpandableEntryHeaderProps = {
  indexLabel: number | string
  title: string
  subtitle?: string | null
  /** Featured image or video URL shown beside title on the closed row. */
  mediaUrl?: string | null
  isExpanded: boolean
  onToggle: () => void
  onRemove?: () => void
  showRemove?: boolean
  accent?: AccentBadge
  trailing?: ReactNode
  dragHandleProps?: DragHandleProps
}

export function ExpandableEntryHeader({
  indexLabel,
  title,
  subtitle,
  mediaUrl,
  isExpanded,
  onToggle,
  onRemove,
  showRemove = false,
  accent = defaultAccent,
  trailing,
  dragHandleProps,
}: ExpandableEntryHeaderProps) {
  const pointerStart = useRef<{ x: number; y: number } | null>(null)
  const didDrag = useRef(false)

  const dragClassName = dragHandleProps?.className
  const restDragProps = dragHandleProps
    ? {
        draggable: dragHandleProps.draggable,
        onDragStart: dragHandleProps.onDragStart,
        title: dragHandleProps.title,
      }
    : {}

  return (
    <div className="flex items-center gap-1 border-b border-slate-200/50 px-2 py-2 sm:gap-2 sm:px-4 dark:border-white/5">
      {dragHandleProps ? (
        <span
          {...restDragProps}
          aria-label={dragHandleProps['aria-label'] ?? 'Drag to reorder'}
          className={cn(
            'flex h-9 w-7 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300',
            dragClassName
          )}
        >
          <GripVertical className="h-4 w-4" aria-hidden />
        </span>
      ) : null}

      <div
        {...(dragHandleProps
          ? {
              ...restDragProps,
              className: cn(
                'flex min-w-0 flex-1 items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-slate-100/70 sm:gap-4 sm:px-4 dark:hover:bg-white/5',
                dragClassName
              ),
              onPointerDown: (e: PointerEvent) => {
                pointerStart.current = { x: e.clientX, y: e.clientY }
                didDrag.current = false
              },
              onPointerMove: (e: PointerEvent) => {
                if (!pointerStart.current) return
                const dx = Math.abs(e.clientX - pointerStart.current.x)
                const dy = Math.abs(e.clientY - pointerStart.current.y)
                if (dx > CLICK_DRAG_THRESHOLD_PX || dy > CLICK_DRAG_THRESHOLD_PX) {
                  didDrag.current = true
                }
              },
              onClick: () => {
                if (didDrag.current) {
                  didDrag.current = false
                  pointerStart.current = null
                  return
                }
                onToggle()
              },
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle()
                }
              },
              role: 'button',
              tabIndex: 0,
              'aria-expanded': isExpanded,
            }
          : {
              role: 'button',
              tabIndex: 0,
              onClick: onToggle,
              onKeyDown: (e: KeyboardEvent) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  onToggle()
                }
              },
              'aria-expanded': isExpanded,
              className:
                'flex min-w-0 flex-1 cursor-pointer items-center gap-3 rounded-2xl px-2 py-3 text-left transition-colors hover:bg-slate-100/70 sm:gap-4 sm:px-4 dark:hover:bg-white/5',
            })}
      >
        <div
          className={cn(
            'flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] border font-black shadow-sm',
            accent.border,
            accent.bg,
            accent.text
          )}
        >
          {indexLabel}
        </div>
        <EntryAttachmentThumb url={mediaUrl} />
        <div className="min-w-0 flex-1">
          <h4 className="truncate text-[16px] font-black text-slate-900 dark:text-white">{title}</h4>
          {!isExpanded && subtitle ? (
            <p className="mt-0.5 truncate text-[12px] font-medium text-slate-500 dark:text-slate-400">{subtitle}</p>
          ) : null}
        </div>
      </div>

      <button
        type="button"
        data-no-dnd
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse entry' : 'Expand entry'}
        className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-white/5 dark:hover:text-slate-300"
      >
        <ChevronDown
          className={cn(
            'h-5 w-5 shrink-0 transition-transform duration-300',
            isExpanded && cn('rotate-180', accent.chevronOpen ?? 'text-cyan-500')
          )}
          aria-hidden
        />
      </button>

      {trailing}
      {showRemove && onRemove ? (
        <button
          type="button"
          data-no-dnd
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          className="mr-2 flex shrink-0 cursor-pointer items-center gap-2 rounded-xl bg-red-50 px-3 py-2.5 font-bold text-red-500 opacity-100 transition-all group-hover/card:opacity-100 hover:bg-red-100 hover:text-red-600 focus:opacity-100 sm:px-4 sm:opacity-0 dark:bg-red-500/10 dark:text-red-400 dark:hover:bg-red-500/20"
          title="Remove Entry"
        >
          <Trash2 className="h-4 w-4" />
          <span className="hidden sm:inline">Remove</span>
        </button>
      ) : null}
    </div>
  )
}

type ExpandableEntryBodyProps = {
  isExpanded: boolean
  children: ReactNode
  className?: string
}

export function ExpandableEntryBody({ isExpanded, children, className }: ExpandableEntryBodyProps) {
  // Skip height transition on first paint so mount/remount does not replay open animation.
  const [transitionReady, setTransitionReady] = useState(false)
  useEffect(() => {
    const frame = requestAnimationFrame(() => setTransitionReady(true))
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className={cn(
        'grid',
        transitionReady && 'transition-[grid-template-rows] duration-300 ease-in-out',
        isExpanded ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
      )}
    >
      <div className="min-h-0 overflow-hidden">
        <div className={cn(className, !isExpanded && 'pointer-events-none invisible')} aria-hidden={!isExpanded}>
          {children}
        </div>
      </div>
    </div>
  )
}

export const bottomAddButtonClass =
  'flex w-full items-center justify-center gap-2 rounded-[14px] border border-black/5 bg-white px-6 py-3.5 text-[13px] font-bold shadow-sm transition-all hover:bg-slate-200 active:scale-95 sm:w-auto dark:border-white/5 dark:bg-[#0b0f19]'
