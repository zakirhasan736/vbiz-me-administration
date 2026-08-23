'use client'

import { MediaSourceActions, type MediaSourceMode } from '@/components/MediaSourceActions'
import { ReorderList } from '@/components/ReorderList'
import { MediaUploadError, uploadMediaWithProgress } from '@/lib/media/uploadMediaWithProgress'
import { cn } from '@/utils/cn'
import { File, FileText, GripVertical, Image as ImageIcon, Loader2, Trash2, Upload } from 'lucide-react'
import { useRef, useState } from 'react'

export type UploadedDoc = {
  id: string
  name: string
  url: string
  type: string
  size: number
}

const ACCEPT =
  'image/*,.pdf,.txt,.doc,.docx,application/pdf,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

const MAX_BYTES = 5 * 1024 * 1024 // 5MB

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function isAllowed(file: File) {
  const name = file.name.toLowerCase()
  const okExt =
    /\.(png|jpe?g|gif|webp|svg|pdf|txt|doc|docx)$/i.test(name) ||
    file.type.startsWith('image/') ||
    ['application/pdf', 'text/plain'].includes(file.type)
  return okExt && file.size <= MAX_BYTES
}

function DocIcon({ type, name }: { type: string; name: string }) {
  if (type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(name)) {
    return <ImageIcon className="h-4 w-4 text-teal-600 dark:text-teal-400" />
  }
  if (type.includes('pdf') || name.toLowerCase().endsWith('.pdf')) {
    return <FileText className="h-4 w-4 text-rose-500" />
  }
  return <File className="h-4 w-4 text-indigo-500" />
}

type Props = {
  files: UploadedDoc[]
  onChange: (files: UploadedDoc[]) => void
  multiple?: boolean
  label?: string
  hint?: string
  accent?: 'indigo' | 'teal' | 'violet'
  /** Show Connect Canva (+ Gallery/Custom for video). Image-only areas get Canva only. */
  mediaAssist?: MediaSourceMode | false
  /** When set, uploads to media API instead of blob URLs. */
  profileId?: string | null
  attachmentType?: string
}

export function DocumentUploadArea({
  files,
  onChange,
  multiple = true,
  label = 'Upload document',
  hint = 'Image, PDF, TXT, DOC — max 5MB each',
  accent = 'indigo',
  mediaAssist = 'image',
  profileId,
  attachmentType = 'Certificate Document',
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState('')
  const [uploading, setUploading] = useState(false)

  const accentRing =
    accent === 'teal'
      ? 'hover:border-teal-400/60 focus-within:border-teal-500'
      : accent === 'violet'
        ? 'hover:border-violet-400/60 focus-within:border-violet-500'
        : 'hover:border-indigo-400/60 focus-within:border-indigo-500'
  const accentIcon =
    accent === 'teal'
      ? 'text-teal-600 dark:text-teal-400'
      : accent === 'violet'
        ? 'text-violet-600 dark:text-violet-400'
        : 'text-indigo-600 dark:text-indigo-400'

  const renderFile = (file: UploadedDoc, reorderable: boolean) => (
    <div className="flex items-center gap-3 rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 dark:border-white/10 dark:bg-[#0b0f19]">
      {reorderable ? (
        <span
          className="flex h-9 w-7 shrink-0 items-center justify-center text-slate-400"
          title="Drag to reorder"
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </span>
      ) : null}
      {file.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(file.name) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={file.url}
          alt=""
          className="h-10 w-10 rounded-lg border border-slate-100 object-cover dark:border-white/10"
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-100 bg-slate-50 dark:border-white/10 dark:bg-white/5">
          <DocIcon type={file.type} name={file.name} />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="truncate text-[13px] font-bold text-slate-800 dark:text-slate-100">{file.name}</p>
        <p className="text-[11px] font-semibold text-slate-400">{formatSize(file.size)}</p>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => event.stopPropagation()}
        className="text-primary-600 hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10 rounded-lg px-2 py-1 text-[11px] font-bold"
      >
        View
      </a>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onChange(files.filter((item) => item.id !== file.id))
        }}
        className="rounded-lg p-2 text-slate-400 hover:bg-rose-50 hover:text-rose-500 dark:hover:bg-rose-500/10"
        title="Remove"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )

  const ingest = async (list: FileList | File[]) => {
    const incoming = Array.from(list)
    const rejected = incoming.filter((f) => !isAllowed(f))
    const accepted = incoming.filter(isAllowed)

    if (rejected.length) {
      setError('Some files were skipped. Use image/PDF/TXT/DOC under 5MB.')
    } else {
      setError('')
    }
    if (!accepted.length) return

    if (!profileId) {
      const mapped: UploadedDoc[] = accepted.map((f) => ({
        id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        url: URL.createObjectURL(f),
        type: f.type || 'application/octet-stream',
        size: f.size,
      }))
      onChange(multiple ? [...files, ...mapped] : mapped.slice(0, 1))
      return
    }

    setUploading(true)
    try {
      const mapped: UploadedDoc[] = []
      for (const file of accepted) {
        const result = await uploadMediaWithProgress({
          file,
          profileId,
          attachmentType,
        })
        mapped.push({
          id: `doc_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          url: result.url,
          type: file.type || 'application/octet-stream',
          size: file.size,
        })
      }
      onChange(multiple ? [...files, ...mapped] : mapped.slice(0, 1))
    } catch (err) {
      const message = err instanceof MediaUploadError ? err.message : 'Upload failed. Please try again.'
      setError(message)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] font-black tracking-wider text-slate-400 uppercase">{label}</p>

      <div
        onDragOver={(e) => {
          e.preventDefault()
          if (!uploading) setDragOver(true)
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          if (!uploading && e.dataTransfer.files?.length) void ingest(e.dataTransfer.files)
        }}
        onClick={() => {
          if (!uploading) inputRef.current?.click()
        }}
        className={cn(
          'w-full cursor-pointer rounded-2xl border-2 border-dashed bg-slate-50/80 px-4 py-8 text-center transition-colors dark:bg-white/3',
          uploading && 'pointer-events-none opacity-70',
          dragOver
            ? 'border-primary-500 bg-primary-50/40 dark:bg-primary-500/10'
            : cn('border-slate-200 dark:border-white/15', accentRing)
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files?.length) void ingest(e.target.files)
            e.target.value = ''
          }}
        />
        {uploading ? (
          <Loader2 className={cn('mx-auto mb-2 h-7 w-7 animate-spin', accentIcon)} />
        ) : (
          <Upload className={cn('mx-auto mb-2 h-7 w-7', accentIcon)} />
        )}
        <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
          {uploading ? 'Uploading…' : 'Drop files here or click to upload'}
        </p>
        <p className="mt-1 text-[11px] font-semibold text-slate-400">{hint}</p>
      </div>

      {mediaAssist !== false && (
        <MediaSourceActions
          mode={mediaAssist}
          compact
          profileId={profileId}
          onSelect={(asset) => {
            const doc: UploadedDoc = {
              id: `canva_${Date.now()}`,
              name: asset.name,
              url: asset.url,
              type: asset.kind === 'video' ? 'video/mp4' : 'image/jpeg',
              size: 0,
            }
            onChange(multiple ? [...files, doc] : [doc])
          }}
        />
      )}

      {error && <p className="text-[12px] font-semibold text-rose-500">{error}</p>}

      {files.length > 0 ? (
        multiple && files.length > 1 ? (
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-semibold text-slate-400">Drag uploaded items to change their order.</p>
            <ReorderList
              items={files}
              getKey={(file) => file.id}
              onReorder={onChange}
              className="space-y-2"
              renderItem={(file) => renderFile(file, true)}
            />
          </div>
        ) : (
          <div className="pt-1">{renderFile(files[0]!, false)}</div>
        )
      ) : null}
    </div>
  )
}
