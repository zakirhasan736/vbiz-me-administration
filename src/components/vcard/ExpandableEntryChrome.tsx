'use client'

import { ModalPortal } from '@/components/ModalPortal'
import type { DragHandleProps } from '@/components/ReorderList'
import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { cn } from '@/utils/cn'
import { ChevronDown, Film, GripVertical, Maximize2, Play, Trash2, X } from 'lucide-react'
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

function toEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname.replace(/^www\./, '')
    if (host === 'youtu.be') {
      const id = parsed.pathname.replace(/^\//, '').split('/')[0]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'youtube.com' || host === 'm.youtube.com') {
      const id = parsed.searchParams.get('v') || parsed.pathname.match(/\/embed\/([^/?#]+)/)?.[1]
      return id ? `https://www.youtube.com/embed/${id}` : null
    }
    if (host === 'vimeo.com') {
      const id = parsed.pathname.split('/').filter(Boolean)[0]
      return id ? `https://player.vimeo.com/video/${id}` : null
    }
    if (host.includes('dailymotion.com')) {
      const id = parsed.pathname.split('/').filter(Boolean).pop()
      return id ? `https://www.dailymotion.com/embed/video/${id}` : null
    }
  } catch {
    return null
  }
  return null
}

function EntryAttachmentLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  const src = encodeMediaUrl(url) || url
  const video = isVideoUrl(src)
  const embed = video ? toEmbedUrl(src) : null

  useEffect(() => {
    const onKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = prev
    }
  }, [onClose])

  return (
    <ModalPortal>
      <div
        className="fixed inset-0 z-200 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-label="Attachment preview"
      >
        <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-[2px]" onClick={onClose} />
        <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#0b1018]">
          <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-3 dark:border-white/5">
            <p className="truncate text-sm font-semibold text-slate-700 dark:text-slate-200">
              {video ? 'Video attachment' : 'Image attachment'}
            </p>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close attachment preview"
              className="rounded-xl p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 dark:hover:bg-white/10 dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950/5 p-3 dark:bg-black/40">
            {embed ? (
              <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
                <iframe
                  src={embed}
                  title="Video preview"
                  className="h-full w-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : video ? (
              <video
                src={src}
                controls
                autoPlay
                playsInline
                className="max-h-[min(80vh,820px)] w-auto max-w-full rounded-2xl bg-black"
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element -- editor lightbox for arbitrary remote URLs
              <img
                src={src}
                alt="Attachment preview"
                className="max-h-[min(80vh,820px)] w-auto max-w-full rounded-2xl object-contain"
              />
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}

/** Image/video preview for collapsed accordion rows — click opens lightbox. */
export function EntryAttachmentThumb({ url, className }: { url?: string | null; className?: string }) {
  const [open, setOpen] = useState(false)
  const trimmed = url?.trim() ?? ''
  if (!trimmed) return null
  const src = encodeMediaUrl(trimmed)
  if (!src) return null

  const video = isVideoUrl(src)
  const embedHost = /(?:youtube\.com|youtu\.be|vimeo\.com|dailymotion\.com)/i.test(src)
  const canShowImage = !video && isUsableImageSrc(src)

  return (
    <>
      <button
        type="button"
        data-no-dnd
        title="Preview attachment"
        aria-label="Preview attachment"
        onClick={(e) => {
          e.preventDefault()
          e.stopPropagation()
          setOpen(true)
        }}
        onPointerDown={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        className={cn(
          'relative h-16 w-16 shrink-0 cursor-zoom-in overflow-hidden rounded-2xl border border-slate-200/90 bg-slate-100 shadow-sm transition hover:ring-2 hover:ring-slate-300/80 sm:h-20 sm:w-20 dark:border-white/10 dark:bg-white/5 dark:hover:ring-white/20',
          className
        )}
      >
        {video && embedHost ? (
          <span className="flex h-full w-full items-center justify-center text-slate-500 dark:text-slate-300">
            <Film className="h-6 w-6" />
          </span>
        ) : video ? (
          <video src={src} muted playsInline preload="metadata" className="h-full w-full object-cover" />
        ) : canShowImage ? (
          // eslint-disable-next-line @next/next/no-img-element -- editor preview; arbitrary remote URLs
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-slate-400">
            <Film className="h-6 w-6" />
          </span>
        )}
        {video ? (
          <span className="absolute inset-0 flex items-center justify-center bg-black/30">
            <Play className="h-5 w-5 fill-white text-white" />
          </span>
        ) : (
          <span className="pointer-events-none absolute right-1.5 bottom-1.5 inline-flex h-6 w-6 items-center justify-center rounded-lg bg-slate-950/65 text-white shadow-sm backdrop-blur-[1px]">
            <Maximize2 className="h-3.5 w-3.5" strokeWidth={2.25} />
          </span>
        )}
      </button>
      {open ? <EntryAttachmentLightbox url={trimmed} onClose={() => setOpen(false)} /> : null}
    </>
  )
}

type ExpandableEntryHeaderProps = {
  /** @deprecated Number badge removed from accordion rows; kept optional for call-site compatibility. */
  indexLabel?: number | string
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
