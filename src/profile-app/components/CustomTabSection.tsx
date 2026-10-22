'use client'

import { SkeletonMediaShell, SkeletonVideo, useMediaLoadState } from '@/components/media/SkeletonMedia'
import { profileMediaFitStyle, type ProfileMediaFrame } from '@/lib/media/profileMediaFrame'
import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { CertificateImageLightbox, type CertificatePreview } from '@/profile-app/components/CertificateImageLightbox'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3EmptyState, V3SectionHeader, V3SectionShell } from '@/profile-app/sections'
import { ExternalLink, Layers, Maximize2 } from 'lucide-react'
import { AnimatePresence } from 'motion/react'
import Image from 'next/image'
import { useState } from 'react'

const RICH_PROSE =
  'vcard-rich-html vbiz-description prose prose-sm max-w-none leading-relaxed font-medium ' +
  '[&_a]:text-[var(--vbiz-accent,#eab308)] [&_a]:underline-offset-2 hover:[&_a]:underline ' +
  '[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-[var(--vbiz-text)] ' +
  '[&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-[var(--vbiz-text)] ' +
  '[&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-[var(--vbiz-text)] ' +
  '[&_p]:mb-3 [&_p]:leading-relaxed ' +
  '[&_strong]:font-bold [&_strong]:text-[var(--vbiz-text)] ' +
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 ' +
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_li]:mb-1'

type CustomTabSectionProps = {
  title: string
  sectionName?: string
}

function youtubeEmbedSrc(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function FeaturedMedia({
  src,
  alt,
  forceVideo,
  frame,
  onOpenImage,
}: {
  src: string
  alt: string
  forceVideo?: boolean
  frame?: ProfileMediaFrame | null
  onOpenImage?: () => void
}) {
  const encoded = encodeMediaUrl(src)
  if (!encoded && !youtubeEmbedSrc(src)) return null
  const youtube = youtubeEmbedSrc(src)
  if (youtube) {
    return (
      <iframe
        src={youtube}
        title={alt}
        className="h-full w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    )
  }
  if (!encoded) return null
  const fit = frame ? profileMediaFitStyle(frame) : undefined
  if (forceVideo || isVideoUrl(encoded)) {
    return (
      <SkeletonVideo
        src={encoded}
        fill
        mediaClassName="object-cover"
        style={fit}
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
        skeletonLabel="Loading media"
      />
    )
  }
  if (!isUsableImageSrc(encoded)) return null
  return <FeaturedNextImage src={encoded} alt={alt} frame={frame} onOpenImage={onOpenImage} />
}

function FeaturedNextImage({
  src,
  alt,
  frame,
  onOpenImage,
}: {
  src: string
  alt: string
  frame?: ProfileMediaFrame | null
  onOpenImage?: () => void
}) {
  const { loaded, markLoaded, markError } = useMediaLoadState(src)
  const interactive = Boolean(onOpenImage)

  const media = (
    <SkeletonMediaShell loading={!loaded} label="Loading media" className="absolute inset-0 h-full w-full">
      <Image
        src={src}
        alt={alt}
        fill
        className={`object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={frame ? profileMediaFitStyle(frame) : undefined}
        sizes="(max-width: 768px) 100vw, 640px"
        onLoadingComplete={markLoaded}
        onError={markError}
      />
      {interactive ? (
        <span
          className="absolute right-3 bottom-3 z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/25 bg-black/45 text-white shadow-sm backdrop-blur-md"
          aria-hidden
        >
          <Maximize2 size={16} strokeWidth={2.25} />
        </span>
      ) : null}
    </SkeletonMediaShell>
  )

  if (!interactive) return media

  return (
    <button
      type="button"
      onClick={onOpenImage}
      className="absolute inset-0 h-full w-full cursor-zoom-in text-left"
      aria-label={`View full image: ${alt}`}
    >
      {media}
    </button>
  )
}

export function CustomTabSection({ title, sectionName }: CustomTabSectionProps) {
  const { customTabs, design } = useProfileDisplay()
  const accent = design?.accentColor ?? '#eab308'
  const needle = sectionName?.trim() || ''
  const tab = customTabs.find(
    (entry) => entry.id === needle || entry.label.trim() === title.trim() || (needle && entry.label.trim() === needle)
  )
  const items = (tab?.items || []).filter((item) => item.active !== false)
  const sectionTitle = tab?.label?.trim() || title
  const [preview, setPreview] = useState<CertificatePreview | null>(null)

  if (!tab || !items.length) {
    return (
      <V3EmptyState icon={Layers} title={sectionTitle} message="No content is available for this custom tab yet." />
    )
  }

  return (
    <V3SectionShell>
      <div className="w-full pb-20">
        <V3SectionHeader badge={sectionTitle} badgeIcon={Layers} title={sectionTitle} />
        <div className="space-y-6">
          {items.map((item) => {
            const media = item.mediaUrl?.trim() || ''
            const link = item.url?.trim() || ''
            const html = item.description?.trim() || ''
            const forceVideo = item.mediaKind === 'video'
            const isImage =
              Boolean(media) &&
              !forceVideo &&
              !isVideoUrl(media) &&
              !youtubeEmbedSrc(media) &&
              isUsableImageSrc(encodeMediaUrl(media) || media)

            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
              >
                {media ? (
                  <div className="relative h-[240px] w-full overflow-hidden bg-zinc-900 md:h-[360px]">
                    <FeaturedMedia
                      src={media}
                      alt={item.title || sectionTitle}
                      forceVideo={forceVideo}
                      frame={item.mediaFrame}
                      onOpenImage={
                        isImage
                          ? () =>
                              setPreview({
                                title: item.title?.trim() || sectionTitle,
                                imageUrl: media,
                                mediaKind: 'image',
                                description: (item.description || '').replace(/<[^>]+>/g, '').trim(),
                                detailUrl: link,
                                credentialLabel: '',
                                year: '',
                              })
                          : undefined
                      }
                    />
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/55 via-black/10 to-transparent" />
                    <span className="vbiz-section-pill pointer-events-none absolute top-3 left-3 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
                      <Layers size={12} /> {sectionTitle}
                    </span>
                  </div>
                ) : link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.title || 'link'}`}
                    className="relative flex h-[200px] w-full flex-col items-center justify-center gap-4 overflow-hidden bg-zinc-100 transition hover:bg-zinc-200 md:h-[240px] dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                    <span className="vbiz-section-pill relative z-10 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold tracking-wide uppercase">
                      <Layers size={12} /> {sectionTitle}
                    </span>
                    <span
                      className="vbiz-btn relative z-10 inline-flex items-center gap-2 px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                      data-role="primary"
                    >
                      <ExternalLink size={16} /> Open link
                    </span>
                  </a>
                ) : null}
                <div className="space-y-4 p-5 md:p-8">
                  {item.title?.trim() ? (
                    <h3 className="vbiz-title text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
                      {item.title.trim()}
                    </h3>
                  ) : null}
                  {html ? (
                    html.includes('<') ? (
                      <div className={RICH_PROSE} dangerouslySetInnerHTML={{ __html: html }} />
                    ) : (
                      <TruncatedClampText plain={html} className="vbiz-description text-sm font-medium" />
                    )
                  ) : null}
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="vbiz-btn inline-flex items-center gap-2 px-5 py-3 text-sm font-bold transition-opacity hover:opacity-90"
                      data-role="primary"
                    >
                      <ExternalLink size={16} /> {media ? 'Learn more' : 'Open link'}
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>

      <AnimatePresence>
        {preview ? (
          <CertificateImageLightbox preview={preview} accent={accent} onClose={() => setPreview(null)} />
        ) : null}
      </AnimatePresence>
    </V3SectionShell>
  )
}
