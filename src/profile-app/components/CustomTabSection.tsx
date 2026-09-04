'use client'

import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3EmptyState, V3SectionHeader, V3SectionShell } from '@/profile-app/sections'
import { ExternalLink, Layers } from 'lucide-react'
import Image from 'next/image'

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

function FeaturedMedia({ src, alt, forceVideo }: { src: string; alt: string; forceVideo?: boolean }) {
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
  if (forceVideo || isVideoUrl(encoded)) {
    return (
      <video
        src={encoded}
        className="h-full w-full object-cover"
        controls
        playsInline
        preload="metadata"
        aria-label={alt}
      />
    )
  }
  if (!isUsableImageSrc(encoded)) return null
  return <Image src={encoded} alt={alt} fill className="object-cover" sizes="(max-width: 768px) 100vw, 640px" />
}

export function CustomTabSection({ title, sectionName }: CustomTabSectionProps) {
  const { customTabs } = useProfileDisplay()
  const needle = sectionName?.trim() || ''
  const tab = customTabs.find(
    (entry) => entry.id === needle || entry.label.trim() === title.trim() || (needle && entry.label.trim() === needle)
  )
  const items = (tab?.items || []).filter((item) => item.active !== false)
  const sectionTitle = tab?.label?.trim() || title

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
            return (
              <article
                key={item.id}
                className="overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50"
              >
                {media ? (
                  <div className="relative h-[240px] w-full overflow-hidden bg-zinc-900 md:h-[360px]">
                    <FeaturedMedia src={media} alt={item.title || sectionTitle} forceVideo={forceVideo} />
                  </div>
                ) : link ? (
                  <a
                    href={link}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Open ${item.title || 'link'}`}
                    className="relative flex h-[200px] w-full items-center justify-center overflow-hidden bg-zinc-100 transition hover:bg-zinc-200 md:h-[240px] dark:bg-zinc-950 dark:hover:bg-zinc-900"
                  >
                    <div className="absolute inset-0 bg-linear-to-t from-black/40 via-transparent to-transparent" />
                    <span className="relative z-10 inline-flex items-center gap-2 rounded-2xl bg-white/90 px-5 py-3 text-sm font-bold text-zinc-900 shadow-lg backdrop-blur-sm">
                      <ExternalLink size={16} /> Open link
                    </span>
                  </a>
                ) : null}
                <div className="space-y-4 p-5 md:p-8">
                  {item.title?.trim() ? (
                    <h3 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-zinc-100">
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
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                    >
                      <ExternalLink size={16} /> {media ? 'Learn more' : 'Open video link'}
                    </a>
                  ) : null}
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </V3SectionShell>
  )
}
