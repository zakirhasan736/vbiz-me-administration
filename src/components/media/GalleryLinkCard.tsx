'use client'

import { ReliableImage } from '@/components/media/ReliableImage'
import type { GalleryLinkPreview } from '@/lib/media/linkPreview'
import { Link2 } from 'lucide-react'

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

/** Share-card for a gallery page: preview image, title, description, and the link. */
export function GalleryLinkCard({ preview }: { preview: GalleryLinkPreview }) {
  const host = hostnameOf(preview.url)
  const title = preview.title || preview.siteName || host
  const description = preview.description.trim()

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-2xl border border-white/10 bg-[#161618] shadow-lg"
    >
      {preview.image ? (
        <div className="relative aspect-[16/10] w-full overflow-hidden bg-black">
          <ReliableImage src={preview.image} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}
      <div className="space-y-1 px-4 py-3">
        <p className="line-clamp-2 text-[15px] leading-snug font-semibold text-white">{title}</p>
        {description ? <p className="line-clamp-2 text-[13px] leading-snug text-white/70">{description}</p> : null}
        <p className="flex items-center gap-1.5 pt-0.5 text-[13px] text-[#7eb6ff]">
          <Link2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="truncate">{host}</span>
        </p>
      </div>
    </a>
  )
}
