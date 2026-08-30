'use client'

import {
  mediaNeedsClientOptimize,
  MediaUploadError,
  uploadMediaWithProgress,
} from '@/lib/media/uploadMediaWithProgress'
import { cn } from '@/utils/cn'
import { FileAudio, FileIcon, FileText, FileVideo, Image as ImageIcon, Loader2, Trash2, Upload, X } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react'

export type MediaUploadResult = {
  url: string
  fileName: string
  publicId?: string
  mimeType?: string
}

export type MediaFileUploaderProps = {
  value?: string | null
  fileName?: string | null
  onChange: (next: MediaUploadResult | null) => void
  profileId?: string | null
  attachmentType?: string
  /** MIME / extension accept string. Defaults to images, video, audio, and common docs. */
  accept?: string
  /** Max file size in bytes. Defaults to the signed-in package per-file cap. */
  maxBytes?: number
  label?: string
  hint?: string
  className?: string
  disabled?: boolean
  allowUrlPaste?: boolean
  /** Visual accent for borders/focus (matches section themes). */
  accent?: 'teal' | 'primary' | 'violet' | 'sky' | 'rose'
}

const DEFAULT_ACCEPT = [
  'image/*',
  'video/*',
  'audio/*',
  'application/pdf',
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.zip',
  '.txt',
].join(',')

const accentMap = {
  teal: {
    ring: 'focus-within:border-teal-500 focus-within:ring-teal-500',
    icon: 'text-teal-600 dark:text-teal-400',
    btn: 'group-hover/drop:text-teal-600 dark:group-hover/drop:text-teal-400',
    borderHover: 'hover:border-teal-400/60 dark:hover:border-teal-500/40',
    bar: 'bg-teal-500',
  },
  primary: {
    ring: 'focus-within:border-primary-500 focus-within:ring-primary-500',
    icon: 'text-primary-600 dark:text-primary-400',
    btn: 'group-hover/drop:text-primary-600 dark:group-hover/drop:text-primary-400',
    borderHover: 'hover:border-primary-400/60 dark:hover:border-primary-500/40',
    bar: 'bg-primary-500',
  },
  violet: {
    ring: 'focus-within:border-violet-500 focus-within:ring-violet-500',
    icon: 'text-violet-600 dark:text-violet-400',
    btn: 'group-hover/drop:text-violet-600 dark:group-hover/drop:text-violet-400',
    borderHover: 'hover:border-violet-400/60 dark:hover:border-violet-500/40',
    bar: 'bg-violet-500',
  },
  sky: {
    ring: 'focus-within:border-sky-500 focus-within:ring-sky-500',
    icon: 'text-sky-600 dark:text-sky-400',
    btn: 'group-hover/drop:text-sky-600 dark:group-hover/drop:text-sky-400',
    borderHover: 'hover:border-sky-400/60 dark:hover:border-sky-500/40',
    bar: 'bg-sky-500',
  },
  rose: {
    ring: 'focus-within:border-rose-500 focus-within:ring-rose-500',
    icon: 'text-rose-600 dark:text-rose-400',
    btn: 'group-hover/drop:text-rose-600 dark:group-hover/drop:text-rose-400',
    borderHover: 'hover:border-rose-400/60 dark:hover:border-rose-500/40',
    bar: 'bg-rose-500',
  },
} as const

function guessKind(url: string, mimeType?: string | null, fileName?: string | null) {
  const mime = (mimeType || '').toLowerCase()
  const name = (fileName || url.split('?')[0] || '').toLowerCase()
  const haystack = `${url} ${name}`.toLowerCase()
  if (
    mime.startsWith('video/') ||
    /\.(mp4|webm|mov|m4v|ogg|ogv)(\?|#|$)/i.test(haystack) ||
    /\/video\/upload\//i.test(url)
  ) {
    return 'video'
  }
  if (mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|avif|svg|bmp)$/i.test(name)) return 'image'
  if (mime.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(name)) return 'audio'
  if (mime === 'application/pdf' || name.endsWith('.pdf')) return 'pdf'
  return 'file'
}

function formatBytes(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function MediaFileUploader({
  value,
  fileName,
  onChange,
  profileId,
  attachmentType,
  accept = DEFAULT_ACCEPT,
  maxBytes,
  label = 'Media file',
  hint,
  className,
  disabled = false,
  allowUrlPaste = true,
  accent = 'primary',
}: MediaFileUploaderProps) {
  void maxBytes
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStage, setUploadStage] = useState<'preparing' | 'uploading' | null>(null)
  const [progress, setProgress] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localPreview, setLocalPreview] = useState<string | null>(null)
  const [localMime, setLocalMime] = useState<string | null>(null)
  const [urlDraft, setUrlDraft] = useState('')

  const styles = accentMap[accent]
  const displayUrl = localPreview || value || ''
  const displayName = fileName || (value ? value.split('/').pop()?.split('?')[0] : '') || ''
  const uploadLabel = uploadStage === 'preparing' ? 'Optimizing…' : 'Uploading…'
  const kind = useMemo(
    () => (displayUrl ? guessKind(displayUrl, localMime, displayName) : null),
    [displayUrl, localMime, displayName]
  )

  useEffect(() => {
    return () => {
      abortRef.current?.abort()
    }
  }, [])

  useEffect(() => {
    return () => {
      if (localPreview?.startsWith('blob:')) URL.revokeObjectURL(localPreview)
    }
  }, [localPreview])

  const clearLocalPreview = useCallback(() => {
    setLocalPreview((prev) => {
      if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev)
      return null
    })
    setLocalMime(null)
  }, [])

  const applyUpload = useCallback(
    async (file: File) => {
      if (disabled) return
      setError(null)

      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      clearLocalPreview()
      const blobUrl = URL.createObjectURL(file)
      setLocalPreview(blobUrl)
      setLocalMime(file.type)
      setUploading(true)
      setUploadStage(mediaNeedsClientOptimize(file) ? 'preparing' : 'uploading')
      setProgress(0)

      try {
        const result = await uploadMediaWithProgress({
          file,
          profileId: profileId || undefined,
          attachmentType,
          signal: controller.signal,
          onStatus: setUploadStage,
          onProgress: setProgress,
        })
        clearLocalPreview()
        onChange({
          url: result.url,
          fileName: file.name,
          publicId: result.publicId,
          mimeType: file.type,
        })
      } catch (err) {
        if (controller.signal.aborted) return
        const message =
          err instanceof MediaUploadError ? err.message : err instanceof Error ? err.message : 'Upload failed'
        setError(message)
        // Keep local blob preview for UX; do not persist blob: URLs to parent state.
      } finally {
        if (abortRef.current === controller) abortRef.current = null
        setUploading(false)
        setUploadStage(null)
      }
    },
    [attachmentType, clearLocalPreview, disabled, onChange, profileId]
  )

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0]
    if (!file) return
    void applyUpload(file)
  }

  const remove = () => {
    if (disabled) return
    abortRef.current?.abort()
    setError(null)
    setUploading(false)
    setUploadStage(null)
    setProgress(0)
    clearLocalPreview()
    setUrlDraft('')
    if (inputRef.current) inputRef.current.value = ''
    onChange(null)
  }

  const applyUrl = () => {
    const next = urlDraft.trim()
    if (!next) return
    setError(null)
    clearLocalPreview()
    onChange({
      url: next,
      fileName: next.split('/').pop()?.split('?')[0] || 'remote-file',
    })
    setUrlDraft('')
  }

  const PreviewIcon = kind === 'video' ? FileVideo : kind === 'audio' ? FileAudio : kind === 'pdf' ? FileText : FileIcon

  return (
    <div className={cn('group flex flex-col space-y-2', className)}>
      {label ? (
        <label
          htmlFor={inputId}
          className="flex items-center gap-2 pl-1 text-[11px] font-bold tracking-wider text-slate-500 uppercase dark:text-slate-400"
        >
          <ImageIcon className={cn('h-3.5 w-3.5', styles.icon)} />
          {label}
        </label>
      ) : null}

      <div
        className={cn(
          'group/drop relative overflow-hidden rounded-2xl border border-dashed border-slate-200/80 bg-white shadow-sm transition-all dark:border-white/10 dark:bg-[#0b0f19]',
          styles.ring,
          styles.borderHover,
          isDragging && 'border-solid bg-slate-50 dark:bg-white/5',
          disabled && 'pointer-events-none opacity-60'
        )}
        onDragEnter={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault()
          setIsDragging(false)
        }}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          handleFiles(e.dataTransfer.files)
        }}
      >
        <input
          id={inputId}
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          disabled={disabled || uploading}
          onChange={(e) => {
            handleFiles(e.target.files)
            e.target.value = ''
          }}
        />

        {displayUrl ? (
          <div className="flex flex-col gap-3 p-3 sm:flex-row sm:items-stretch">
            <div className="relative flex h-36 w-full shrink-0 items-center justify-center overflow-hidden rounded-xl border border-slate-200/80 bg-slate-50 sm:h-28 sm:w-40 dark:border-white/10 dark:bg-white/5">
              {kind === 'image' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayUrl} alt={displayName || 'Upload preview'} className="h-full w-full object-cover" />
              ) : kind === 'video' ? (
                <video src={displayUrl} className="h-full w-full object-cover" controls muted playsInline />
              ) : kind === 'audio' ? (
                <div className="flex w-full flex-col items-center gap-2 px-3">
                  <FileAudio className={cn('h-8 w-8', styles.icon)} />
                  <audio src={displayUrl} controls className="w-full" />
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 px-3 text-center">
                  <PreviewIcon className={cn('h-8 w-8', styles.icon)} />
                  <span className="line-clamp-2 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    {displayName || 'File'}
                  </span>
                </div>
              )}
              {uploading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/45 px-3 backdrop-blur-[1px]">
                  <Loader2 className="h-5 w-5 animate-spin text-white" />
                  <div className="w-full space-y-1">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/25">
                      <div
                        className={cn('h-full rounded-full transition-[width] duration-150 ease-out', styles.bar)}
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                      />
                    </div>
                    <p className="text-center text-[10px] font-bold tracking-wider text-white uppercase">
                      {Math.min(100, Math.max(0, progress))}%
                    </p>
                  </div>
                </div>
              ) : null}
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">
                  {displayName || 'Uploaded file'}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-slate-500 dark:text-slate-400">{displayUrl}</p>
                {kind ? (
                  <p className="mt-1 text-[10px] font-bold tracking-wider text-slate-400 uppercase">{kind}</p>
                ) : null}
                {uploading ? (
                  <p className="mt-2 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                    {uploadLabel} {Math.min(100, Math.max(0, progress))}%
                  </p>
                ) : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-200 dark:hover:bg-white/5"
                >
                  <Upload className="h-3.5 w-3.5" />
                  Replace
                </button>
                <button
                  type="button"
                  onClick={remove}
                  disabled={uploading}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-[12px] font-bold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 dark:border-rose-500/30 dark:bg-rose-500/10 dark:text-rose-300"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove
                </button>
              </div>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex w-full flex-col items-center justify-center gap-2 px-5 py-8 text-center"
          >
            {uploading ? (
              <Loader2 className={cn('h-8 w-8 animate-spin', styles.icon)} />
            ) : (
              <Upload className={cn('h-8 w-8 transition-colors', styles.icon, styles.btn)} />
            )}
            <div className="w-full max-w-xs">
              <p className="text-[13px] font-bold text-slate-800 dark:text-slate-100">
                {uploading
                  ? `${uploadLabel} ${Math.min(100, Math.max(0, progress))}%`
                  : 'Drop a file here or click to browse'}
              </p>
              {uploading ? (
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                  <div
                    className={cn('h-full rounded-full transition-[width] duration-150 ease-out', styles.bar)}
                    style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                  />
                </div>
              ) : (
                <p className="mt-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  {hint || 'Images, video, audio, PDF, and documents • no size limit'}
                </p>
              )}
            </div>
          </button>
        )}
      </div>

      {allowUrlPaste ? (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlDraft}
            onChange={(e) => setUrlDraft(e.target.value)}
            placeholder="Or paste a media URL"
            disabled={disabled || uploading}
            className="w-full rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-[13px] font-medium text-slate-900 shadow-sm outline-none focus:border-slate-400 dark:border-white/10 dark:bg-[#0b0f19] dark:text-white"
          />
          <button
            type="button"
            onClick={applyUrl}
            disabled={disabled || uploading || !urlDraft.trim()}
            className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[12px] font-bold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50 dark:border-white/10 dark:bg-white/5 dark:text-slate-200"
          >
            Use URL
          </button>
          {urlDraft ? (
            <button
              type="button"
              onClick={() => setUrlDraft('')}
              className="shrink-0 rounded-2xl border border-slate-200 px-3 text-slate-500 dark:border-white/10"
              aria-label="Clear URL"
            >
              <X className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {error ? <p className="pl-1 text-[12px] font-medium text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  )
}

export { formatBytes as formatMediaBytes, DEFAULT_ACCEPT as MEDIA_FILE_UPLOADER_ACCEPT }
