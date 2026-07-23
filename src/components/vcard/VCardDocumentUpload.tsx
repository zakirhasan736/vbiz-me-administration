'use client'

import {
  getDemoAutoFillForSection,
  VCARD_UPLOAD_SECTION_LABELS,
  type VCardAutoFillResult,
  type VCardUploadSection,
} from '@/lib/vcardAutoFillDemo'
import { cn } from '@/utils/cn'
import { CheckCircle2, FileImage, FileText, Loader2, Sparkles, Upload, X } from 'lucide-react'
import Image from 'next/image'
import { useCallback, useRef, useState } from 'react'

const ACCEPT =
  'image/jpeg,image/png,image/webp,image/gif,application/pdf,.pdf,.doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'

type UploadStatus = 'idle' | 'reading' | 'done' | 'error'

export type VCardDocumentUploadProps = {
  section: VCardUploadSection
  onAutoFill: (fields: VCardAutoFillResult) => void
  className?: string
}

export function VCardDocumentUpload({ section, onAutoFill, className }: VCardDocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [filledCount, setFilledCount] = useState(0)
  const [isDragging, setIsDragging] = useState(false)

  const { title, description } = VCARD_UPLOAD_SECTION_LABELS[section]

  const reset = useCallback(() => {
    setStatus('idle')
    setFile(null)
    setFilledCount(0)
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    if (inputRef.current) inputRef.current.value = ''
  }, [previewUrl])

  const runDemoExtraction = useCallback(
    async (selected: File) => {
      setFile(selected)
      setStatus('reading')
      if (selected.type.startsWith('image/')) {
        setPreviewUrl(URL.createObjectURL(selected))
      } else {
        setPreviewUrl(null)
      }

      await new Promise((r) => setTimeout(r, 1600))

      const fields = getDemoAutoFillForSection(section)
      onAutoFill(fields)
      setFilledCount(Object.keys(fields).length)
      setStatus('done')
    },
    [onAutoFill, section]
  )

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const selected = files?.[0]
      if (!selected) return
      void runDemoExtraction(selected)
    },
    [runDemoExtraction]
  )

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFiles(e.dataTransfer.files)
  }

  const isImage = file?.type.startsWith('image/')

  return (
    <div
      className={cn(
        'border-primary-300/60 from-primary-50/80 dark:border-primary-500/25 dark:from-primary-500/6 mb-8 overflow-hidden rounded-[24px] border border-dashed bg-linear-to-br via-white to-slate-50/80 p-6 shadow-sm dark:via-[#0b0f19] dark:to-white/2',
        className
      )}
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <div className="border-primary-200 dark:border-primary-500/30 dark:bg-primary-500/10 flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] border bg-white shadow-sm">
            <Sparkles className="text-primary-600 dark:text-primary-400 h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="mb-1 flex flex-wrap items-center gap-2">
              <h3 className="text-[15px] font-black text-slate-900 dark:text-white">{title}</h3>
              <span className="rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold tracking-wider text-amber-700 uppercase dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
                Demo
              </span>
            </div>
            <p className="text-[13px] leading-relaxed font-medium text-slate-500 dark:text-slate-400">{description}</p>
          </div>
        </div>
        {file && status !== 'reading' && (
          <button
            type="button"
            onClick={reset}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[12px] font-bold text-slate-600 transition-colors hover:bg-slate-50 dark:border-white/10 dark:bg-[#1e2333] dark:text-slate-300 dark:hover:bg-[#252b3d]"
          >
            <X className="h-3.5 w-3.5" />
            Clear
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        className="sr-only"
        accept={ACCEPT}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && inputRef.current?.click()}
        onClick={() => status !== 'reading' && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        className={cn(
          'relative flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-3 rounded-[20px] border-2 border-dashed px-6 py-8 text-center transition-all',
          isDragging
            ? 'border-primary-500 bg-primary-50/80 dark:bg-primary-500/10'
            : 'hover:border-primary-400/70 dark:hover:border-primary-500/40 border-slate-200/80 bg-white/70 hover:bg-white dark:border-white/10 dark:bg-[#0b0f19]/60',
          status === 'reading' && 'pointer-events-none opacity-80'
        )}
      >
        {status === 'reading' ? (
          <>
            <Loader2 className="text-primary-600 dark:text-primary-400 h-8 w-8 animate-spin" />
            <p className="text-[14px] font-bold text-slate-700 dark:text-slate-200">Reading document…</p>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Extracting fields from {file?.name}
            </p>
          </>
        ) : status === 'done' ? (
          <>
            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            <p className="text-[14px] font-bold text-slate-900 dark:text-white">
              Filled {filledCount} fields from your upload
            </p>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              Demo data applied — connect the API later for real OCR / parsing.
            </p>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2 text-slate-400">
              <FileImage className="h-6 w-6" />
              <FileText className="h-6 w-6" />
            </div>
            <p className="text-[14px] font-bold text-slate-800 dark:text-slate-100">
              Drop image or document here, or click to browse
            </p>
            <p className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
              JPG, PNG, PDF, DOC — max 10MB (demo)
            </p>
            <span className="bg-primary-600 mt-1 inline-flex items-center gap-2 rounded-full px-4 py-2 text-[12px] font-bold text-white shadow-sm">
              <Upload className="h-3.5 w-3.5" />
              Choose file
            </span>
          </>
        )}
      </div>

      {file && status === 'done' && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[16px] border border-emerald-200/60 bg-emerald-50/50 px-4 py-3 dark:border-emerald-500/20 dark:bg-emerald-500/5">
          {previewUrl && isImage ? (
            <Image
              src={previewUrl}
              alt="Preview"
              className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover dark:border-white/10"
              width={48}
              height={48}
            />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white dark:border-white/10 dark:bg-[#1e2333]">
              <FileText className="h-5 w-5 text-slate-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{file.name}</p>
            <p className="text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              Review the updated fields below
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
