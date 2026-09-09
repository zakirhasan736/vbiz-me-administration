'use client'

import { encodeMediaUrl, isUsableImageSrc } from '@/lib/mediaUrl'
import { hasResumeContent } from '@/lib/vcardResume'
import { downloadResumeFile } from '@/profile-app/lib/downloadResumeFile'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle } from '@/profile-app/lib/sectionTitleContext'
import { V3EmptyState, V3SectionHeader, V3SectionShell } from '@/profile-app/sections'
import type { VCardResumeDocument } from '@/types/vcard'
import { Download, Eye, FileText, Image as ImageIcon, Loader2, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

type ResumeSectionProps = {
  sectionName?: string
}

type PreviewDoc = {
  href: string
  label: string
  kind: 'image' | 'pdf' | 'file'
}

function isImageDoc(doc: VCardResumeDocument): boolean {
  return doc.type.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/i.test(doc.name)
}

function isPdfDoc(doc: VCardResumeDocument): boolean {
  return doc.type.includes('pdf') || /\.pdf$/i.test(doc.name)
}

function documentKind(doc: VCardResumeDocument): PreviewDoc['kind'] {
  if (isImageDoc(doc)) return 'image'
  if (isPdfDoc(doc)) return 'pdf'
  return 'file'
}

/** Friendly label — never the raw uploaded filename. */
function documentLabel(doc: VCardResumeDocument, index: number, total: number): string {
  const kind = documentKind(doc)
  const base = kind === 'image' ? 'Resume image' : kind === 'pdf' ? 'Resume PDF' : 'Resume document'
  return total > 1 ? `${base} ${index + 1}` : base
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

function ResumeDocLightbox({ preview, onClose }: { preview: PreviewDoc; onClose: () => void }) {
  const isClient = useIsClient()
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadResumeFile({ url: preview.href, label: preview.label, kind: preview.kind })
    } catch {
      /* keep UI quiet — retry still available */
    } finally {
      setDownloading(false)
    }
  }

  if (!isClient) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="vbiz-modal-backdrop fixed inset-0 z-200 flex items-center justify-center px-3 pt-14 pb-24 backdrop-blur-sm sm:px-6 sm:pt-20 sm:pb-28"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={preview.label}
    >
      <button
        type="button"
        aria-label="Close preview"
        onClick={onClose}
        className="vbiz-modal-close absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border sm:top-6 sm:right-6"
      >
        <X size={20} />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 8 }}
        transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
        className="relative flex w-full max-w-[min(920px,94vw)] flex-col overflow-hidden"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-zinc-950">
          {preview.kind === 'image' && isUsableImageSrc(preview.href) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview.href} alt={preview.label} className="max-h-[calc(100dvh-14rem)] w-full object-contain" />
          ) : preview.kind === 'pdf' ? (
            <iframe
              src={preview.href}
              title={preview.label}
              className="h-[min(70dvh,640px)] w-full border-0 bg-zinc-100 dark:bg-zinc-900"
            />
          ) : (
            <div className="flex min-h-60 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-12 text-center dark:bg-zinc-900">
              <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-zinc-200 bg-white text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800">
                <FileText size={28} />
              </span>
              <p className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{preview.label}</p>
              <p className="max-w-sm text-sm font-medium text-zinc-500 dark:text-zinc-400">
                Preview isn’t available for this file type. Download it to view on your device.
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 px-1 sm:mt-4">
          <p className="text-base font-bold text-white">{preview.label}</p>
          <button
            type="button"
            onClick={() => void handleDownload()}
            disabled={downloading}
            className="inline-flex items-center gap-2 rounded-xl bg-[#eab308] px-4 py-2 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90 disabled:cursor-wait disabled:opacity-70"
          >
            {downloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} strokeWidth={2.25} />}
            {downloading ? 'Downloading…' : 'Download'}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}

function DocCard({ doc, label, onOpen }: { doc: VCardResumeDocument; label: string; onOpen: () => void }) {
  const href = encodeMediaUrl(doc.url.trim()) || doc.url.trim()
  const kind = documentKind(doc)
  const image = kind === 'image' && isUsableImageSrc(href)
  const [downloading, setDownloading] = useState(false)

  const handleDownload = async () => {
    if (downloading) return
    setDownloading(true)
    try {
      await downloadResumeFile({ url: href, label, kind })
    } catch {
      /* keep UI quiet — retry still available */
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="group flex w-full items-center gap-4 rounded-3xl border border-zinc-200 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition hover:border-zinc-300 hover:bg-white/90 dark:border-zinc-800/80 dark:bg-zinc-900/50 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/80">
      <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-4 text-left">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={href}
            alt=""
            className="h-14 w-14 shrink-0 rounded-2xl border border-zinc-200 object-cover dark:border-zinc-700"
          />
        ) : (
          <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
            {kind === 'image' ? <ImageIcon size={22} /> : <FileText size={22} />}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-100">{label}</p>
          <p className="mt-0.5 text-xs font-medium text-zinc-500 dark:text-zinc-400">Tap to preview</p>
        </div>
      </button>

      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Preview ${label}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 text-white transition hover:scale-105 dark:bg-zinc-100 dark:text-zinc-950"
        >
          <Eye size={18} strokeWidth={2.25} />
        </button>
        <button
          type="button"
          onClick={() => void handleDownload()}
          disabled={downloading}
          aria-label={`Download ${label}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-zinc-200 bg-white text-zinc-800 transition hover:scale-105 hover:border-zinc-300 disabled:cursor-wait disabled:opacity-70 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:border-zinc-600"
        >
          {downloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} strokeWidth={2.25} />}
        </button>
      </div>
    </div>
  )
}

/** Resume tab — summary + downloadable documents from the vCard editor. */
export function ResumeSection({ sectionName = 'Resume' }: ResumeSectionProps) {
  const { resume } = useProfileDisplay()
  const sectionTitle = useResolvedSectionTitle(undefined, sectionName.trim() || resume.title || 'Resume')
  const summary = resume.summary?.trim() || ''
  const documents = resume.documents.filter((doc) => doc.url?.trim())
  const hasContent = hasResumeContent(resume)
  const [preview, setPreview] = useState<PreviewDoc | null>(null)

  if (!hasContent) {
    return (
      <V3EmptyState
        icon={FileText}
        title={sectionTitle}
        message="No resume summary or documents have been published yet."
      />
    )
  }

  return (
    <V3SectionShell>
      <div className="flex w-full flex-col gap-4 md:gap-6">
        <V3SectionHeader
          badge={sectionTitle}
          badgeIcon={FileText}
          title={resume.title?.trim() || sectionTitle}
          subtitle="Summary and documents from your vBiz resume."
        />

        {summary ? (
          <div className="vbiz-card rounded-3xl border border-zinc-200 bg-white/60 p-6 shadow-sm backdrop-blur-xl md:p-8 dark:border-zinc-800/80 dark:bg-zinc-900/50">
            <p className="mb-3 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">Summary</p>
            <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap text-zinc-700 md:text-base dark:text-zinc-300">
              {summary}
            </p>
          </div>
        ) : null}

        {documents.length ? (
          <div className="flex flex-col gap-3">
            <p className="px-1 text-[11px] font-bold tracking-wider text-zinc-500 uppercase">
              {documents.length === 1 ? 'Document' : 'Documents'}
            </p>
            {documents.map((doc, index) => {
              const href = encodeMediaUrl(doc.url.trim()) || doc.url.trim()
              const label = documentLabel(doc, index, documents.length)
              return (
                <DocCard
                  key={doc.id || doc.url}
                  doc={doc}
                  label={label}
                  onOpen={() =>
                    setPreview({
                      href,
                      label,
                      kind: documentKind(doc),
                    })
                  }
                />
              )
            })}
          </div>
        ) : null}
      </div>

      {preview ? <ResumeDocLightbox preview={preview} onClose={() => setPreview(null)} /> : null}
    </V3SectionShell>
  )
}
