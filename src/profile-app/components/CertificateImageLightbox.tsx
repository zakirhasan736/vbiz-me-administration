'use client'

import { encodeMediaUrl, isDocumentUrl, isUsableImageSrc } from '@/lib/mediaUrl'
import { Award, ExternalLink, FileText, X } from 'lucide-react'
import { motion } from 'motion/react'
import { useEffect, useSyncExternalStore } from 'react'
import { createPortal } from 'react-dom'

export type CertificateMediaKind = 'image' | 'pdf' | 'document'

export type CertificatePreview = {
  title: string
  imageUrl: string
  /** When omitted, inferred from `imageUrl`. */
  mediaKind?: CertificateMediaKind
  description: string
  detailUrl: string
  credentialLabel: string
  year: string
}

export function resolveCertificateMediaKind(url: string): CertificateMediaKind {
  const trimmed = url.trim()
  if (!trimmed) return 'image'
  if (/\.pdf(\?|#|$)/i.test(trimmed) || /^data:application\/pdf/i.test(trimmed)) return 'pdf'
  if (isDocumentUrl(trimmed) || /\.(txt|docx?|rtf)(\?|#|$)/i.test(trimmed)) return 'document'
  if (/\.(png|jpe?g|gif|webp|svg|avif|bmp)(\?|#|$)/i.test(trimmed) || /^data:image\//i.test(trimmed)) {
    return 'image'
  }
  // Extensionless CDN URLs are usually images in this product.
  if (!/\.(pdf|docx?|txt|rtf)(\?|#|$)/i.test(trimmed)) return 'image'
  return 'document'
}

function useIsClient() {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  )
}

export function CertificateImageLightbox({
  preview,
  accent,
  onClose,
}: {
  preview: CertificatePreview
  accent: string
  onClose: () => void
}) {
  const isClient = useIsClient()
  const mediaUrl = encodeMediaUrl(preview.imageUrl) || preview.imageUrl.trim()
  const kind = preview.mediaKind ?? resolveCertificateMediaKind(mediaUrl)
  const openHref = preview.detailUrl.trim() || mediaUrl

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

  if (!isClient) return null

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-200 flex items-center justify-center bg-zinc-950/75 px-3 pt-14 pb-24 backdrop-blur-sm sm:px-6 sm:pt-20 sm:pb-28"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${preview.title} certificate preview`}
    >
      <button
        type="button"
        aria-label="Close certificate preview"
        onClick={onClose}
        className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white transition-colors hover:bg-black/75 sm:top-6 sm:right-6"
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
        <div className="overflow-hidden rounded-lg bg-white shadow-2xl">
          {kind === 'image' && mediaUrl && isUsableImageSrc(mediaUrl) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={mediaUrl} alt={preview.title} className="max-h-[calc(100dvh-12rem)] w-full object-contain" />
          ) : kind === 'pdf' && mediaUrl ? (
            <iframe src={mediaUrl} title={preview.title} className="h-[min(70dvh,720px)] w-full border-0 bg-zinc-100" />
          ) : mediaUrl ? (
            <div className="flex min-h-60 flex-col items-center justify-center gap-4 bg-zinc-50 px-6 py-12 text-center">
              <FileText size={40} style={{ color: accent }} />
              <p className="text-lg font-bold text-zinc-900">{preview.title}</p>
              {preview.description ? <p className="max-w-md text-sm text-zinc-600">{preview.description}</p> : null}
              {openHref ? (
                <a
                  href={openHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: accent }}
                >
                  Open document <ExternalLink size={14} />
                </a>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-60 flex-col items-center justify-center gap-3 bg-zinc-50 px-6 py-12 text-center">
              <Award size={40} style={{ color: accent }} />
              <p className="text-lg font-bold text-zinc-900">{preview.title}</p>
              {preview.description ? <p className="max-w-md text-sm text-zinc-600">{preview.description}</p> : null}
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-col gap-2 px-1 sm:mt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-base font-bold text-white">{preview.title}</p>
              {preview.description ? (
                <p className="mt-0.5 line-clamp-2 text-sm text-white/75">{preview.description}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {preview.year ? (
                <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white/90">
                  {preview.year}
                </span>
              ) : null}
              {preview.credentialLabel ? (
                <span className="max-w-40 truncate rounded-full border border-white/20 bg-white/10 px-2.5 py-1 font-mono text-[11px] text-white/90">
                  {preview.credentialLabel}
                </span>
              ) : null}
            </div>
          </div>

          {openHref && (kind === 'pdf' || kind === 'document' || preview.detailUrl.trim()) ? (
            <a
              href={openHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-zinc-950 transition-opacity hover:opacity-90"
              style={{ backgroundColor: accent }}
            >
              {kind === 'image' ? 'View details' : 'Open document'} <ExternalLink size={14} />
            </a>
          ) : null}
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
