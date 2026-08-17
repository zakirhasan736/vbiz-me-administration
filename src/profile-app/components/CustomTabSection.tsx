'use client'

import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3EmptyState, V3SectionHeader, V3SectionShell } from '@/profile-app/sections'
import { ExternalLink, Layers } from 'lucide-react'
import Image from 'next/image'

const RICH_PROSE =
  'vcard-rich-html prose prose-sm dark:prose-invert max-w-none leading-relaxed font-medium text-zinc-600 dark:text-zinc-300 ' +
  '[&_a]:text-[#eab308] [&_a]:underline-offset-2 hover:[&_a]:underline ' +
  '[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-zinc-900 dark:[&_h1]:text-white ' +
  '[&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-zinc-900 dark:[&_h2]:text-white ' +
  '[&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-zinc-900 dark:[&_h3]:text-white ' +
  '[&_p]:mb-3 [&_p]:leading-relaxed ' +
  '[&_strong]:font-bold [&_strong]:text-zinc-900 dark:[&_strong]:text-white ' +
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
                      <TruncatedClampText
                        plain={html}
                        className="text-sm font-medium text-zinc-600 dark:text-zinc-400"
                      />
                    )
                  ) : null}
                  {link ? (
                    <a
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-5 py-3 text-sm font-bold text-white transition hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white"
                    >
                      <ExternalLink size={16} /> Learn more
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
