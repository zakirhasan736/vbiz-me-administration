'use client'

import { ConfirmModal } from '@/components/ConfirmModal'
import { PackageFeatureLockNote } from '@/components/PackageFeatureLockNote'
import { useMediaUploadLimit } from '@/hooks/usePackageAccess'
import {
  isVideoFile,
  mediaFileTooLargeMessage,
  mediaNeedsClientOptimize,
  MediaUploadError,
  uploadMediaWithProgress,
} from '@/lib/media/uploadMediaWithProgress'
import { isVideoUrl } from '@/lib/mediaUrl'
import { PACKAGE_FEATURE_LOCKED_MESSAGE } from '@/lib/packageAccess'
import { cn } from '@/utils/cn'
import { Film, Loader2, Music, Trash2, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { type ReactNode, useCallback, useEffect, useId, useRef, useState } from 'react'

export type VCardMediaPreviewKind = 'image' | 'video' | 'audio' | 'auto'

export type VCardMediaFieldProps = {
  value?: string | null
  onChange: (url: string | null) => void
  profileId?: string | null
  attachmentType: string
  accept: string
  maxBytes?: number
  title?: string
  subtitle?: string
  icon?: ReactNode
  iconWrapperClassName?: string
  browseLabel?: string
  selectPlaceholder?: string
  previewKind?: VCardMediaPreviewKind
  /** Tab1-style column (card + preview) vs inset body used inside Tab4 sections. */
  variant?: 'column' | 'inset'
  placeholderImage?: string | null
  emptyIcon?: ReactNode
  videoAutoPlay?: boolean
  previewClassName?: string
  className?: string
  children?: ReactNode
  disabled?: boolean
  /** Block new uploads (existing preview and remove stay available). */
  locked?: boolean
  allowVideo?: boolean
  allowAudio?: boolean
}

export function mediaLabel(url: string, fallback: string, fileName?: string | null) {
  if (fileName) return fileName
  if (!url) return fallback
  if (url.startsWith('blob:')) return 'Uploaded file'
  try {
    return decodeURIComponent(new URL(url).pathname.split('/').pop() || fallback)
  } catch {
    return fallback
  }
}

export function guessMediaKind(
  url: string,
  preferred: VCardMediaPreviewKind,
  fileName?: string | null
): 'image' | 'video' | 'audio' {
  if (preferred === 'video' || preferred === 'audio' || preferred === 'image') return preferred

  const name = (fileName || url.split('?')[0] || '').toLowerCase()
  if (/\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(name)) return 'video'
  if (/\.(mp3|wav|m4a|aac|flac)$/i.test(name)) return 'audio'
  if (/\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(name)) return 'image'
  if (url.startsWith('blob:')) return 'image'
  if (isVideoUrl(url)) return 'video'
  return 'image'
}

function UploadProgressBar({ progress, label = 'Uploading…' }: { progress: number; label?: string }) {
  const pct = Math.min(100, Math.max(0, progress))
  return (
    <div className="mt-3 space-y-1.5 px-1">
      <div className="flex items-center justify-between text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
        <span>{label}</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
        <div
          className="bg-primary-500 h-full rounded-full transition-[width] duration-150 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PreviewBadge() {
  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <p className="rounded-full bg-white/50 px-4 py-2 text-sm font-bold tracking-widest text-slate-900/40 uppercase backdrop-blur-md dark:bg-black/50 dark:text-white/30">
        Preview
      </p>
    </div>
  )
}

export function VCardMediaField({
  value,
  onChange,
  profileId,
  attachmentType,
  accept,
  maxBytes,
  title,
  subtitle,
  icon,
  iconWrapperClassName,
  browseLabel = 'Browse',
  selectPlaceholder = 'Select file',
  previewKind = 'auto',
  variant = 'column',
  placeholderImage = null,
  emptyIcon,
  videoAutoPlay = false,
  previewClassName,
  className,
  children,
  disabled = false,
  locked = false,
  allowVideo = true,
  allowAudio = true,
}: VCardMediaFieldProps) {
  const packageLimit = useMediaUploadLimit()
  const limitBytes = maxBytes ?? packageLimit.maxBytes
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<'preparing' | 'uploading' | null>(null)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [localFileName, setLocalFileName] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const savedUrl = (value || '').trim()
  const [prevSavedUrl, setPrevSavedUrl] = useState(savedUrl)

  // Adjust during render when an external URL replaces a stale blob preview
  // (gallery/Canva/hydration). Avoids setState-in-effect cascading renders.
  if (savedUrl !== prevSavedUrl) {
    setPrevSavedUrl(savedUrl)
    if (savedUrl && !savedUrl.startsWith('blob:') && localPreview) {
      if (localPreview.startsWith('blob:')) URL.revokeObjectURL(localPreview)
      setLocalPreview(null)
    }
  }

  const displayUrl = localPreview || savedUrl
  const resolvedKind = displayUrl ? guessMediaKind(displayUrl, previewKind, localFileName) : null

  const clearLocalPreview = useCallback(() => {
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
  }, [])

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- revoke only on unmount
  }, [])

  const uploadBlocked = disabled || locked

  const applyUpload = useCallback(
    async (file: File) => {
      if (uploadBlocked) return
      setError(null)
      if (isVideoFile(file) && !allowVideo) {
        setError(PACKAGE_FEATURE_LOCKED_MESSAGE)
        return
      }
      if (file.type.startsWith('audio/') && !allowAudio) {
        setError(PACKAGE_FEATURE_LOCKED_MESSAGE)
        return
      }

      if (file.size > limitBytes) {
        setError(mediaFileTooLargeMessage(limitBytes))
        return
      }

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      clearLocalPreview()
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview(blobUrl)
      setLocalFileName(file.name)
      setUploading(true)
      setUploadStage(mediaNeedsClientOptimize(file) ? 'preparing' : 'uploading')
      setProgress(0)

      try {
        const result = await uploadMediaWithProgress({
          file,
          profileId: profileId || undefined,
          attachmentType,
          maxBytes: limitBytes,
          signal: controller.signal,
          onStatus: setUploadStage,
          onProgress: setProgress,
        })
        clearLocalPreview()
        setLocalFileName(file.name)
        onChange(result.url)
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof MediaUploadError ? err.message : err instanceof Error ? err.message : 'Upload failed'
        setError(message)
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setUploading(false)
        setUploadStage(null)
      }
    },
    [allowAudio, allowVideo, attachmentType, clearLocalPreview, limitBytes, onChange, profileId, uploadBlocked]
  )

  const clear = () => {
    if (disabled) return
    abortRef.current?.abort()
    abortRef.current = null
    setUploading(false)
    setUploadStage(null)
    setProgress(0)
    setError(null)
    clearLocalPreview()
    setLocalFileName(null)
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  const handleConfirmRemove = () => {
    clear()
    setConfirmOpen(false)
  }

  const confirmModal = (
    <ConfirmModal
      open={confirmOpen}
      onCancel={() => setConfirmOpen(false)}
      onConfirm={handleConfirmRemove}
      variant="danger"
      icon={Trash2}
      title="Remove this file?"
      description="This media will be removed from the card."
      confirmLabel="Remove"
      cancelLabel="Cancel"
      labelledBy={`remove-media-title-${inputId}`}
      describedBy={`remove-media-description-${inputId}`}
    />
  )

  const browseRow = (
    <div className="space-y-0">
      <div className="focus-within:border-primary-500/50 group relative flex overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]">
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          disabled={uploadBlocked || uploading}
          onChange={(e) => {
            const file = e.target.files?.[0]
            e.target.value = ''
            if (file) void applyUpload(file)
          }}
        />
        <button
          type="button"
          disabled={uploadBlocked || uploading}
          onClick={() => inputRef.current?.click()}
          className="flex shrink-0 cursor-pointer items-center gap-2 border-r border-slate-200/80 bg-slate-50 px-4 py-3.5 text-[13px] font-bold whitespace-nowrap text-slate-900 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60 sm:px-5 sm:py-4 dark:border-white/10 dark:bg-slate-800/50 dark:text-white dark:hover:bg-slate-800"
        >
          {uploading ? <Loader2 className="h-4 w-4 shrink-0 animate-spin" /> : <Upload className="h-4 w-4 shrink-0" />}{' '}
          {displayUrl ? 'Replace' : browseLabel}
        </button>
        <span className="flex min-w-0 flex-1 items-center truncate px-4 py-3.5 text-[13px] font-medium text-slate-500 sm:px-5 sm:py-4 dark:text-slate-400">
          {displayUrl ? mediaLabel(displayUrl, selectPlaceholder, localFileName) : selectPlaceholder}
        </span>
        {displayUrl ? (
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={disabled || uploading}
            className="flex shrink-0 items-center gap-1.5 border-l border-slate-200/80 bg-rose-50 px-3 py-3.5 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-50 sm:px-4 dark:border-white/10 dark:bg-rose-500/10 dark:text-rose-300 dark:hover:bg-rose-500/20"
            aria-label="Remove media"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Remove</span>
          </button>
        ) : null}
      </div>
      {uploading ? (
        <UploadProgressBar progress={progress} label={uploadStage === 'preparing' ? 'Optimizing…' : undefined} />
      ) : null}
      {error ? <p className="mt-2 pl-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
      {locked ? <PackageFeatureLockNote className="mt-2 pl-1" /> : null}
    </div>
  )

  const previewPanel = (
    <div
      className={cn(
        'group relative flex items-center justify-center overflow-hidden rounded-3xl border border-slate-200/50 bg-slate-50/50 shadow-sm dark:border-white/5 dark:bg-white/2',
        variant === 'column' && !previewClassName && 'aspect-video',
        variant === 'inset' && !previewClassName && 'min-h-40',
        previewClassName
      )}
    >
      {displayUrl && resolvedKind === 'video' ? (
        <video
          src={displayUrl}
          controls={!videoAutoPlay}
          autoPlay={videoAutoPlay}
          loop={videoAutoPlay}
          muted={videoAutoPlay}
          playsInline
          className="h-full w-full object-cover"
        />
      ) : displayUrl && resolvedKind === 'audio' ? (
        <div className="flex w-full items-center gap-3 p-6">
          <Music className="h-6 w-6 shrink-0 text-emerald-600 dark:text-emerald-400" />
          <audio src={displayUrl} controls className="w-full" />
        </div>
      ) : displayUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={displayUrl} alt={title || 'Media preview'} className="h-full w-full object-cover" />
      ) : placeholderImage ? (
        <>
          <Image
            src={placeholderImage}
            alt=""
            className="h-full w-full object-cover opacity-10 grayscale transition-all duration-500 group-hover:opacity-20"
            width={800}
            height={800}
          />
          <PreviewBadge />
        </>
      ) : (
        <>
          <div className="flex h-full w-full items-center justify-center bg-slate-50/50 dark:bg-white/2">
            {emptyIcon || <Film className="h-10 w-10 text-slate-300 dark:text-slate-600" />}
          </div>
          <PreviewBadge />
        </>
      )}

      {displayUrl ? (
        <button
          type="button"
          onClick={() => setConfirmOpen(true)}
          disabled={disabled || uploading}
          className="absolute top-4 right-4 rounded-full border border-slate-200 bg-white/90 p-2.5 text-slate-900 shadow-lg backdrop-blur-md transition-all hover:border-red-200 hover:bg-red-50 hover:text-red-500 active:scale-95 disabled:opacity-50 dark:border-white/10 dark:bg-black/50 dark:text-white dark:hover:border-red-500/50 dark:hover:bg-red-500/20"
          aria-label="Remove media"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  )

  if (variant === 'inset') {
    return (
      <div className={cn('space-y-4', className)}>
        {confirmModal}
        {subtitle ? (
          <p className="text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
            {subtitle}
          </p>
        ) : null}
        {browseRow}
        {previewPanel}
        {locked ? null : children}
      </div>
    )
  }

  return (
    <div className={cn('space-y-6', className)}>
      {confirmModal}
      <div className="rounded-3xl border border-slate-200/50 bg-slate-50/50 p-6 shadow-sm dark:border-white/5 dark:bg-white/2">
        {(icon || title) && (
          <div className="mb-5 flex items-center gap-4">
            {icon ? (
              <div
                className={cn(
                  'bg-primary-50 dark:bg-primary-500/10 border-primary-100 dark:border-primary-500/20 flex h-10 w-10 items-center justify-center rounded-[14px] border',
                  iconWrapperClassName
                )}
              >
                {icon}
              </div>
            ) : null}
            <div>
              {title ? (
                <h4 className="text-[15px] leading-none font-black text-slate-900 dark:text-white">{title}</h4>
              ) : null}
              {subtitle ? (
                <p className="mt-1.5 text-[12px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400">
                  {subtitle}
                </p>
              ) : null}
            </div>
          </div>
        )}
        {browseRow}
      </div>
      {previewPanel}
      {locked ? null : children}
    </div>
  )
}
