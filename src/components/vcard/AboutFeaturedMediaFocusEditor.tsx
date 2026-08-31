'use client'

import { featuredMediaObjectPosition, resolveFeaturedMediaFocusY } from '@/lib/media/featuredMediaFocus'
import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { MoveVertical } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'

const FRAME_CLASS =
  'relative aspect-[4/3] min-h-[200px] max-h-[320px] w-full overflow-hidden rounded-2xl border border-slate-200/80 bg-black/5 shadow-inner dark:border-white/10 dark:bg-black/30'

type AboutFeaturedMediaFocusEditorProps = {
  src: string
  focusY: number | null
  onFocusYChange: (focusY: number) => void
  alt?: string
}

function youtubeEmbedSrc(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

export function AboutFeaturedMediaFocusEditor({
  src,
  focusY,
  onFocusYChange,
  alt = 'Featured media preview',
}: AboutFeaturedMediaFocusEditorProps) {
  const frameRef = useRef<HTMLDivElement>(null)
  const [dragging, setDragging] = useState(false)
  const encoded = encodeMediaUrl(src)
  const youtube = youtubeEmbedSrc(src)
  const resolvedFocusY = resolveFeaturedMediaFocusY(focusY)
  const objectPosition = featuredMediaObjectPosition(resolvedFocusY)

  const updateFromClientY = useCallback(
    (clientY: number) => {
      const frame = frameRef.current
      if (!frame) return
      const rect = frame.getBoundingClientRect()
      if (rect.height <= 0) return
      const ratio = (clientY - rect.top) / rect.height
      const next = Math.min(100, Math.max(0, Math.round(ratio * 100)))
      onFocusYChange(next)
    },
    [onFocusYChange]
  )

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (youtube) return
    event.preventDefault()
    event.currentTarget.setPointerCapture(event.pointerId)
    setDragging(true)
    updateFromClientY(event.clientY)
  }

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || youtube) return
    updateFromClientY(event.clientY)
  }

  const endDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    setDragging(false)
  }

  if (youtube) {
    return (
      <div className="space-y-2">
        <div className={FRAME_CLASS}>
          <iframe
            src={youtube}
            title={alt}
            className="h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
          Position adjustment applies to uploaded images and videos. Embedded YouTube links use the player crop.
        </p>
      </div>
    )
  }

  if (!encoded) return null

  const isVideo = isVideoUrl(src) || isVideoUrl(encoded)
  const isImage = !isVideo && isUsableImageSrc(encoded)

  if (!isVideo && !isImage) return null

  return (
    <div className="space-y-2">
      <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
        Drag up or down inside the frame to choose what visitors see on your public About Me card.
      </p>
      <div
        ref={frameRef}
        className={`${FRAME_CLASS} ${youtube ? '' : 'cursor-grab touch-none select-none'} ${dragging ? 'cursor-grabbing ring-2 ring-violet-500/60' : ''}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        role="slider"
        aria-label="Adjust featured media vertical position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={resolvedFocusY}
        tabIndex={0}
        onKeyDown={(event) => {
          if (event.key === 'ArrowUp') {
            event.preventDefault()
            onFocusYChange(Math.max(0, resolvedFocusY - 2))
          } else if (event.key === 'ArrowDown') {
            event.preventDefault()
            onFocusYChange(Math.min(100, resolvedFocusY + 2))
          }
        }}
      >
        {isVideo ? (
          <video
            src={encoded}
            className="pointer-events-none h-full w-full object-cover"
            style={{ objectPosition }}
            muted
            playsInline
            preload="metadata"
            aria-hidden
          />
        ) : (
          <Image
            src={encoded}
            alt={alt}
            fill
            className="pointer-events-none object-cover"
            style={{ objectPosition }}
            sizes="(max-width: 768px) 100vw, 640px"
            draggable={false}
          />
        )}

        <div className="pointer-events-none absolute inset-x-0 top-0 h-8 bg-linear-to-b from-black/35 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t from-black/35 to-transparent" />

        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/70"
          style={{ top: `${resolvedFocusY}%` }}
        />

        <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            <MoveVertical className="h-3.5 w-3.5" />
            {dragging ? 'Release to set' : 'Drag to reposition'}
          </span>
        </div>
      </div>
      <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        Preview matches your public card. Changes save automatically.
      </p>
    </div>
  )
}
