'use client'

import {
  DEFAULT_FEATURE_MEDIA_FRAME,
  isContainedObjectFit,
  parseProfileMediaFrame,
  PROFILE_FRAME_HEIGHT_MAX,
  PROFILE_FRAME_HEIGHT_MIN,
  PROFILE_FRAME_ZOOM_MAX,
  PROFILE_FRAME_ZOOM_MIN,
  PROFILE_MEDIA_OBJECT_FIT_OPTIONS,
  profileFeatureMediaAspectRatio,
  profileFramePreviewHeight,
  profileMediaCoverLayoutStyle,
  profileMediaFramedObjectFitStyle,
  profileMediaObjectFitSelectValue,
  resetFrameForContainedFit,
  type MediaPixelSize,
  type ProfileMediaFrame,
  type ProfileMediaObjectFit,
} from '@/lib/media/profileMediaFrame'
import { Minus, Move, Plus, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

type AvatarMediaFramePreviewProps = {
  src: string
  kind: 'image' | 'video'
  frame?: ProfileMediaFrame | null
  onChange: (frame: ProfileMediaFrame) => void
  alt?: string
  onRemove?: () => void
  removing?: boolean
  /** Portrait avatar frame, or a landscape crop used by featured media. */
  layout?: 'avatar' | 'feature'
  /** Compact controls for the right-column upload layout. */
  compact?: boolean
}

export function AvatarMediaFramePreview({
  src,
  kind,
  frame,
  onChange,
  alt = 'Avatar preview',
  onRemove,
  removing = false,
  layout = 'avatar',
  compact = false,
}: AvatarMediaFramePreviewProps) {
  const boxRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<{ x: number; y: number; focusX: number; focusY: number } | null>(null)
  const [dragging, setDragging] = useState(false)
  const [mediaSizeState, setMediaSizeState] = useState<{ src: string; size: MediaPixelSize | null }>({
    src,
    size: null,
  })
  const [boxSize, setBoxSize] = useState<MediaPixelSize | null>(null)
  // Reset measured pixels when the media URL changes (render-time, not an effect).
  if (mediaSizeState.src !== src) {
    setMediaSizeState({ src, size: null })
  }
  const mediaSize = mediaSizeState.src === src ? mediaSizeState.size : null
  const setMediaSize = (size: MediaPixelSize) => setMediaSizeState({ src, size })
  const resolved = frame
    ? parseProfileMediaFrame(frame)
    : layout === 'feature'
      ? { ...DEFAULT_FEATURE_MEDIA_FRAME }
      : parseProfileMediaFrame(null)
  const featureLayout = layout === 'feature'
  const objectFit = profileMediaObjectFitSelectValue(resolved)
  const contained = featureLayout && isContainedObjectFit(resolved.objectFit)
  const useCoverMath = !featureLayout || objectFit === 'cover'
  // Contain / fill / etc. → CSS object-fit in the black frame. Cover → pixel pan/zoom.
  const fit =
    useCoverMath && mediaSize && boxSize
      ? profileMediaCoverLayoutStyle(resolved, mediaSize, boxSize)
      : profileMediaFramedObjectFitStyle(resolved)

  useEffect(() => {
    if (!useCoverMath) return
    const box = boxRef.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const sync = () => {
      const rect = box.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        setBoxSize({ width: rect.width, height: rect.height })
      }
    }
    sync()
    const observer = new ResizeObserver(sync)
    observer.observe(box)
    return () => observer.disconnect()
  }, [featureLayout, resolved.height, useCoverMath])

  const updateFromPointer = (clientX: number, clientY: number) => {
    if (contained) return
    const start = dragRef.current
    const box = boxRef.current
    if (!start || !box) return
    const rect = box.getBoundingClientRect()
    if (rect.width <= 0 || rect.height <= 0) return
    // Invert drag so the image follows the pointer (grab semantics).
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

  const patchFrame = (patch: Partial<ProfileMediaFrame>) => onChange(parseProfileMediaFrame({ ...resolved, ...patch }))

  const helpText = featureLayout
    ? contained
      ? 'Contain fills the frame from the top-left. Drag is locked. Zoom and frame height still apply.'
      : 'Drag to reposition. Set image object type and height — the public card uses these settings.'
    : 'Drag the photo or video to set top, center, or bottom, and left or right. Zoom in or out — the preview uses that position.'

  return (
    <div className={compact ? 'space-y-2.5' : 'space-y-3'}>
      {!compact ? (
        <p className="text-[12px] font-medium text-slate-600 dark:text-slate-300">{helpText}</p>
      ) : (
        <p className="text-[11px] font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">
          Zoom & frame
        </p>
      )}
      <div
        ref={boxRef}
        className={`relative w-full touch-none overflow-hidden rounded-3xl border border-slate-200/80 bg-black select-none dark:border-white/10 ${
          contained ? 'cursor-default' : dragging ? 'cursor-grabbing ring-2 ring-emerald-500/60' : 'cursor-grab'
        }`}
        style={
          featureLayout
            ? { aspectRatio: profileFeatureMediaAspectRatio(resolved) }
            : { height: profileFramePreviewHeight(resolved) }
        }
        onPointerDown={(event) => {
          if (contained) return
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
          if (contained || !dragRef.current) return
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
        aria-label={
          contained
            ? 'Contained image preview'
            : featureLayout
              ? 'Drag featured media position'
              : 'Drag avatar position'
        }
      >
        {kind === 'video' ? (
          <video
            src={src}
            className="pointer-events-none"
            style={fit}
            muted
            loop
            autoPlay
            playsInline
            preload="metadata"
            aria-label={alt}
            onLoadedMetadata={(event) => {
              const video = event.currentTarget
              if (video.videoWidth > 0 && video.videoHeight > 0) {
                setMediaSize({ width: video.videoWidth, height: video.videoHeight })
              }
            }}
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt}
            draggable={false}
            className="pointer-events-none"
            style={fit}
            onLoad={(event) => {
              const image = event.currentTarget
              if (image.naturalWidth > 0 && image.naturalHeight > 0) {
                setMediaSize({ width: image.naturalWidth, height: image.naturalHeight })
              }
            }}
          />
        )}
        {contained ? null : (
          <>
            <div
              className="pointer-events-none absolute inset-y-0 border-l border-dashed border-white/70"
              style={{ left: `${resolved.focusX}%` }}
            />
            <div
              className="pointer-events-none absolute inset-x-0 border-t border-dashed border-white/70"
              style={{ top: `${resolved.focusY}%` }}
            />
          </>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center p-3">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/55 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-white uppercase backdrop-blur-sm">
            <Move className="h-3.5 w-3.5" />
            {contained ? 'Drag locked' : dragging ? 'Release to set' : 'Drag to reposition'}
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

      <div className={`flex flex-wrap items-center gap-3 ${compact ? 'gap-2' : ''}`}>
        <div className="inline-flex items-center overflow-hidden rounded-2xl border border-slate-200 bg-white dark:border-white/10 dark:bg-[#0b0f19]">
          <button
            type="button"
            className="px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label="Zoom out"
            disabled={resolved.zoom <= PROFILE_FRAME_ZOOM_MIN}
            onClick={() => patchFrame({ zoom: resolved.zoom - 0.1 })}
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="min-w-14 px-2 text-center text-[12px] font-bold text-slate-700 dark:text-slate-200">
            {`${Math.round(resolved.zoom * 100)}%`}
          </span>
          <button
            type="button"
            className="px-3 py-2 text-slate-700 hover:bg-slate-50 disabled:opacity-40 dark:text-slate-200 dark:hover:bg-white/5"
            aria-label="Zoom in"
            disabled={resolved.zoom >= PROFILE_FRAME_ZOOM_MAX}
            onClick={() => patchFrame({ zoom: resolved.zoom + 0.1 })}
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>

        {featureLayout ? (
          <label className="flex min-w-[160px] flex-col gap-1 text-[12px] font-bold text-slate-600 dark:text-slate-300">
            Image object type
            <select
              value={objectFit}
              aria-label="Image object type"
              onChange={(event) => {
                const next = event.target.value as ProfileMediaObjectFit
                // Contain / scale-down: pin to top-left and lock drag. Keep zoom and frame height.
                if (next === 'contain' || next === 'scale-down') {
                  onChange(resetFrameForContainedFit(next, resolved))
                  return
                }
                patchFrame({ objectFit: next })
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-semibold text-slate-800 outline-none focus:border-emerald-500 dark:border-white/10 dark:bg-[#0b0f19] dark:text-slate-100"
            >
              {PROFILE_MEDIA_OBJECT_FIT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        ) : null}

        <label className="flex min-w-[180px] flex-1 flex-col gap-1 text-[12px] font-bold text-slate-600 dark:text-slate-300">
          {featureLayout ? 'Featured image height' : 'Height'}
          <div className="flex items-center gap-2">
            <input
              type="range"
              min={PROFILE_FRAME_HEIGHT_MIN}
              max={PROFILE_FRAME_HEIGHT_MAX}
              step={0.05}
              value={resolved.height}
              aria-label={featureLayout ? 'Adjust featured image height' : 'Adjust avatar height'}
              onChange={(event) => patchFrame({ height: Number(event.target.value) })}
              className="w-full accent-emerald-600"
            />
            <span className="min-w-10 text-right text-[11px] font-bold text-slate-500 dark:text-slate-400">
              {Math.round(resolved.height * 100)}%
            </span>
          </div>
        </label>
      </div>
    </div>
  )
}
