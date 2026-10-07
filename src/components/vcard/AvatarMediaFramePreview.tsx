'use client'

import {
  PROFILE_FRAME_HEIGHT_MAX,
  PROFILE_FRAME_HEIGHT_MIN,
  PROFILE_FRAME_ZOOM_MAX,
  PROFILE_FRAME_ZOOM_MIN,
  parseProfileMediaFrame,
  profileFramePreviewHeight,
  profileMediaFitStyle,
  type ProfileMediaFrame,
} from '@/lib/media/profileMediaFrame'
import { Minus, Move, Plus, X } from 'lucide-react'
import { useRef, useState } from 'react'

type AvatarMediaFramePreviewProps = {
  src: string
  kind: 'image' | 'video'
  frame?: ProfileMediaFrame | null
  onChange: (frame: ProfileMediaFrame) => void
  alt?: string
  onRemove?: () => void
  removing?: boolean
}

export function AvatarMediaFramePreview({
  src,
  kind,
  frame,
  onChange,
  alt = 'Avatar preview',
  onRemove,
  removing = false,
}: AvatarMediaFramePreviewProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; focusX: number; focusY: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const resolved = parseProfileMediaFrame(frame)
  const fit = profileMediaFitStyle(resolved)

  const updateFromPointer = (clientX: number, clientY: number) => {
    const start = dragRef.current
    const box = boxRef.current
    if (!start || !box) return
    const rect = box.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    const dx = ((clientX - start.x) / rect.width) * 100
    const dy = ((clientY - start.y) / rect.height) * 100
    onChange(
      parseProfileMediaFrame({
        ...resolved,
        focusX: start.focusX - dx,
        focusY: start.focusY - dy,
      })
    )
  }

  return (
    <div className="space-y-3">
      <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">
        Drag the photo or video to set top, center, or bottom, and left or right. The preview uses that position.
      </p>
      <div
        ref={boxRef}
        className={`relative w-full cursor-grab touch-none overflow-hidden rounded-3xl border border-slate-200/80 bg-black select-none dark:border-white/10 ${
          dragging ? 'cursor-grabbing ring-2 ring-emerald-500/60' : ''
        }`}
        style={{ height: profileFramePreviewHeight(resolved) }}
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest('button')) return
          event.preventDefault()
          event.currentTarget.setPointerCapture(event.pointerId)
          dragRef.current = {
            x: event.clientX,
            y: event.clientY,
            focusX: resolved.focusX,
            focusY: resolved.focusY,
          }
          setDragging(true)
        }}
        onPointerMove={(event) => {
          if (!dragRef.current) return
          updateFromPointer(event.clientX, event.clientY)
        }}
        onPointerUp={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) {
            event.currentTarget.releasePointerCapture(event.pointerId)
          }
          dragRef.current = null
          setDragging(false)
        }}
        onPointerCancel={() => {
          dragRef.current = null
          setDragging(false)
        }}
        role="application"
        aria-label="Drag avatar position"
      >
        {kind === 'video' ? (
          <video
            src={src}
            className="pointer-events-none h-full w-full"
            style={fit}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            aria-label={alt}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={src} alt={alt} draggable={false} className="pointer-events-none h-full w-full" style={fit} />
        )}
        <div
          className="pointer-events-none absolute inset-y-0 border-l border-dashed border-white/70"
          style={{ left: `${resolved.focusX}%` }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/70"
          style={{ top: `${resolved.focusY}%` }}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            <Move className="h-3.5 w-3.5" />
            {dragging ? 'Release to set' : 'Drag to reposition'}
          </span>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            disabled={removing}
            className="absolute top-4 right-4 z-10 rounded-full border border-slate-200 bg-white/90 p-2.5 text-slate-900 shadow-lg backdrop-blur-md transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:border-white/10 dark:bg-black/50 dark:text-white dark:hover:border-red-500/50 dark:hover:bg-red-500/20"
            aria-label="Remove media"
          >
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b0f19]">
          <button
            type="button"
            className="px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label="Zoom out"
            disabled={resolved.zoom <= PROFILE_FRAME_ZOOM_MIN}
            onClick={() => onChange(parseProfileMediaFrame({ ...resolved, zoom: resolved.zoom - 0.1 }))}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-14 px-2 text-center text-[12px] font-bold text-slate-700 dark:text-slate-200">
            {Math.round(resolved.zoom * 100)}%
          </span>
          <button
            type="button"
            className="px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label="Zoom in"
            disabled={resolved.zoom >= PROFILE_FRAME_ZOOM_MAX}
            onClick={() => onChange(parseProfileMediaFrame({ ...resolved, zoom: resolved.zoom + 0.1 }))}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <label className="flex min-w-[180px] flex-1 items-center gap-2 text-[12px] font-bold text-slate-600 dark:text-slate-300">
          Height
          <input
            type="range"
            min={PROFILE_FRAME_HEIGHT_MIN}
            max={PROFILE_FRAME_HEIGHT_MAX}
            step={0.05}
            value={resolved.height}
            aria-label="Adjust avatar height"
            onChange={(event) => onChange(parseProfileMediaFrame({ ...resolved, height: Number(event.target.value) }))}
            className="w-full accent-emerald-600"
          />
        </label>
      </div>
    </div>
  )
}
