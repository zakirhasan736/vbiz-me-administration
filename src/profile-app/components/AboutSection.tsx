'use client'

import { SkeletonMediaShell, SkeletonVideo, useMediaLoadState } from '@/components/media/SkeletonMedia'
import { DEFAULT_ABOUT_FEATURED_MEDIA_FOCUS_Y, featuredMediaObjectPosition } from '@/lib/media/featuredMediaFocus'
import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useResolvedSectionTitle, useSectionBanner } from '@/profile-app/lib/sectionTitleContext'
import { SectionBannerNotes, V3EmptyState, V3ErrorState, V3SectionShell } from '@/profile-app/sections'
import { useGetAboutMeQuery } from '@/redux/api'
import { BookOpen, Flag, Lightbulb, Quote, Sparkles, Target, Users } from 'lucide-react'
import Image from 'next/image'

const FIXED_SECTION_TITLE = 'About Me'

const PILLAR_ICONS = [Lightbulb, Target, Users, Flag] as const

const ABOUT_INTRO_PROSE =
  'vcard-rich-html prose prose-invert prose-sm md:prose-base relative max-w-2xl pl-2 leading-relaxed font-medium ' +
  '[&_a]:underline-offset-2 hover:[&_a]:underline ' +
  '[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold ' +
  '[&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold ' +
  '[&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold ' +
  '[&_p]:mb-3 [&_p]:leading-relaxed ' +
  '[&_strong]:font-bold ' +
  '[&_em]:italic ' +
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 ' +
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_li]:mb-1 ' +
  '[&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic'

function splitSectionTitle(title: string): { lead: string; accent: string } {
  const words = title.trim().split(/\s+/)
  if (words.length <= 1) return { lead: title, accent: '' }
  return {
    lead: words.slice(0, -1).join(' '),
    accent: words[words.length - 1] ?? '',
  }
}

/** ~400px intro placeholder — only while About API has no item yet. */
function AboutIntroSkeleton() {
  return (
    <div className="w-full max-w-100 animate-pulse space-y-2" aria-hidden>
      <div className="h-4 w-full rounded-md bg-white/15" />
      <div className="h-4 w-5/6 rounded-md bg-white/15" />
      <div className="h-4 w-4/6 rounded-md bg-white/10" />
    </div>
  )
}

function youtubeEmbedSrc(url: string): string | null {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/i)
  return match ? `https://www.youtube.com/embed/${match[1]}` : null
}

function AboutFeaturedMedia({ src, alt, focusY }: { src: string; alt: string; focusY: number }) {
  const encoded = encodeMediaUrl(src)
  const youtube = youtubeEmbedSrc(src)
  const objectPosition = featuredMediaObjectPosition(focusY)

  /** Taller frame; focal point is user-adjustable (defaults to legacy upper bias). */
  const frameClass =
    'vbiz-about-feature relative aspect-[4/3] min-h-[240px] max-h-[340px] w-full overflow-hidden rounded-2xl border border-white/10 bg-black/20 shadow-lg sm:min-h-[280px] sm:max-h-[400px] md:min-h-[300px] md:max-h-[440px]'
  const mediaClass = 'object-cover'

  if (youtube) {
    return (
      <div className={frameClass}>
        <iframe
          src={youtube}
          title={alt}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    )
  }

  if (!encoded) return null

  if (isVideoUrl(src) || isVideoUrl(encoded)) {
    return (
      <div className={frameClass}>
        <SkeletonVideo
          src={encoded}
          fill
          mediaClassName={mediaClass}
          style={{ objectPosition }}
          controls
          playsInline
          preload="metadata"
          aria-label={alt}
          skeletonLabel="Loading About Me media"
        />
      </div>
    )
  }

  if (!isUsableImageSrc(encoded)) return null

  return (
    <div className={frameClass}>
      <AboutFeaturedNextImage src={encoded} alt={alt} objectPosition={objectPosition} mediaClass={mediaClass} />
    </div>
  )
}

function AboutFeaturedNextImage({
  src,
  alt,
  objectPosition,
  mediaClass,
}: {
  src: string
  alt: string
  objectPosition: string
  mediaClass: string
}) {
  const { loaded, markLoaded, markError } = useMediaLoadState(src)
  return (
    <SkeletonMediaShell loading={!loaded} label="Loading About Me media" className="absolute inset-0 h-full w-full">
      <Image
        src={src}
        alt={alt}
        fill
        className={`${mediaClass} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        style={{ objectPosition }}
        sizes="(max-width: 768px) 100vw, 768px"
        priority
        onLoadingComplete={markLoaded}
        onError={markError}
      />
    </SkeletonMediaShell>
  )
}

export const AboutSection = () => {
  const { cardOwnerId, personal, embedded, design } = useProfileDisplay()
  const compact = embedded
  const profileId = cardOwnerId?.trim() ?? ''

  const { data, isLoading, isFetching, isError } = useGetAboutMeQuery(profileId, { skip: !profileId })

  // Section chrome follows the nav tab label (including builder renames).
  const sectionTitle = useResolvedSectionTitle(undefined, FIXED_SECTION_TITLE)
  const banner = useSectionBanner({
    fallbackTitle: sectionTitle,
    fallbackDescription: 'Learn more about the person and story behind this card.',
  })
  const aboutItem = data?.items[0]
  /** Skeleton only until aboutItem exists — never after data arrives (incl. refetch). */
  const isAboutPending = (isLoading || isFetching) && !aboutItem
  const showEmptyState = !isAboutPending && !isError && !aboutItem

  if (!profileId) return null

  if (isError) {
    return <V3ErrorState sectionTitle={sectionTitle} />
  }

  if (showEmptyState) {
    return <V3EmptyState icon={BookOpen} title={sectionTitle} message="No about me content has been published yet." />
  }

  const item = aboutItem
  const heroImage = item?.featuredImage?.trim() ?? ''
  const headline = item?.title?.trim() ?? ''
  const showHeadline = Boolean(headline) && !/^about me$/i.test(headline)
  const hasIntroHtml = Boolean(item?.introHtml?.trim())
  const pillars = item?.pillars ?? []
  const highlight = item?.highlight
  const footer = item?.footer
  const { lead: titleLead, accent: titleAccent } = splitSectionTitle(banner.title || sectionTitle)
  const hasIntro = Boolean(item && (hasIntroHtml || item.plainDescription))
  const ownerInitial = personal.fullName?.trim().charAt(0).toUpperCase() || ''
  const accentColor = design?.accentColor?.trim() || '#eab308'

  return (
    <V3SectionShell>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="vbiz-hero-banner vbiz-about-screen relative flex min-h-52 w-full flex-col overflow-hidden rounded-4xl border shadow-xl sm:min-h-56 md:min-h-64 md:rounded-[2.5rem]">
          <div
            className="pointer-events-none absolute inset-0 z-0 opacity-40"
            style={{
              background: `radial-gradient(circle at 85% 5%, color-mix(in srgb, var(--vbiz-accent, ${accentColor}) 26%, transparent), transparent 38%)`,
            }}
          />

          {ownerInitial ? (
            <div className={`absolute z-20 ${compact ? 'top-3 right-3' : 'top-4 right-4 md:top-6 md:right-6'}`}>
              <div className="vbiz-about-mark border-gold/30 flex h-10 w-10 flex-col items-center justify-center rounded-xl border bg-black/40 shadow-2xl backdrop-blur-xl md:h-12 md:w-12">
                <span className="vbiz-about-mark mb-0.5 font-serif text-lg font-black tracking-tighter drop-shadow-md md:text-2xl">
                  {ownerInitial}
                </span>
              </div>
            </div>
          ) : null}

          <div
            className={`relative z-10 flex h-full w-full grow flex-col justify-end ${
              compact ? 'p-4' : 'p-5 sm:p-6 md:p-8 lg:p-10'
            }`}
          >
            <div className="mt-auto flex max-w-3xl flex-col gap-2 pt-10 sm:gap-3 sm:pt-0 md:gap-3">
              <div className="vbiz-hero-eyebrow vbiz-eyebrow self-start shadow-sm backdrop-blur-md md:text-xs">
                <Sparkles size={14} /> {sectionTitle}
              </div>

              {banner.title ? (
                <h2 className="vbiz-hero-title text-2xl leading-[1.15] font-black tracking-tight sm:text-3xl md:text-4xl lg:text-4xl">
                  {titleAccent ? (
                    <>
                      {titleLead}{' '}
                      <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent">
                        {titleAccent}
                      </span>
                    </>
                  ) : (
                    banner.title
                  )}
                </h2>
              ) : null}
              {banner.description ? (
                <p className="vbiz-hero-subtitle max-w-2xl text-sm leading-snug font-medium md:text-base">
                  {banner.description}
                </p>
              ) : null}
              <SectionBannerNotes notes={banner.notes} />

              {heroImage ? (
                <AboutFeaturedMedia
                  src={heroImage}
                  alt={headline || sectionTitle}
                  focusY={item?.featuredMediaFocusY ?? DEFAULT_ABOUT_FEATURED_MEDIA_FOCUS_Y}
                />
              ) : null}

              {showHeadline ? (
                <p className="vbiz-about-headline max-w-2xl text-sm leading-tight font-bold md:text-base">{headline}</p>
              ) : null}

              {isAboutPending ? (
                <AboutIntroSkeleton />
              ) : hasIntro && item ? (
                <div className="relative">
                  <Quote className="vbiz-about-quote text-gold/10 absolute -top-3 -left-3 -rotate-12" size={32} />
                  <TruncatedClampText
                    html={hasIntroHtml ? item.introHtml : undefined}
                    plain={!hasIntroHtml ? item.plainDescription : undefined}
                    maxLines={5}
                    minLength={180}
                    accentColor={accentColor}
                    seeMoreLabel="See more"
                    seeLessLabel="See less"
                    readMoreLabel="See more"
                    readLessLabel="See less"
                    className="vbiz-about-prose relative z-10"
                    textClassName={
                      hasIntroHtml
                        ? ABOUT_INTRO_PROSE
                        : 'relative max-w-2xl pl-2 text-sm leading-relaxed font-medium md:text-lg'
                    }
                  />
                </div>
              ) : null}

              {highlight ? (
                <div className="vbiz-about-highlight text-base leading-relaxed font-medium md:text-base lg:text-base">
                  {highlight.title ? (
                    <span className="vbiz-hero-heading mb-1 block text-xl font-semibold tracking-tight md:mb-1 md:text-xl">
                      {highlight.title}
                    </span>
                  ) : null}
                  {highlight.html ? (
                    <div
                      className="vcard-rich-html [&_p]:mb-0 [&_strong]:font-medium"
                      dangerouslySetInnerHTML={{ __html: highlight.html }}
                    />
                  ) : highlight.plain ? (
                    <span>{highlight.plain}</span>
                  ) : null}
                </div>
              ) : null}
              {pillars.length > 0 ? (
                <div className={`grid grid-cols-1 gap-2 sm:grid-cols-2 ${highlight ? '' : 'md:col-span-2'}`}>
                  {pillars.map((pillar, idx) => {
                    const Icon = PILLAR_ICONS[idx % PILLAR_ICONS.length]
                    return (
                      <div
                        key={`${pillar.title}-${idx}`}
                        className="vbiz-hero-card vbiz-about-pillar group flex gap-3 rounded-3xl border p-3 shadow-sm transition-colors md:rounded-xl md:p-3"
                      >
                        <div className="vbiz-about-pillar-icon h-9 w-9 rounded-xl p-2 transition-transform duration-300 group-hover:scale-110">
                          <Icon size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-bold md:text-base">{pillar.title}</h4>
                          {pillar.description ? (
                            <p className="text-xs leading-snug font-medium md:text-sm">{pillar.description}</p>
                          ) : null}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : null}

              {footer && (footer.headline || footer.subheadline || footer.tagline) ? (
                <>
                  <div className="relative z-10 flex-1 text-center md:text-left">
                    {footer.headline ? (
                      <h3 className="vbiz-about-footer vbiz-hero-heading text-md mb-1 font-semibold tracking-tight md:mb-1 md:text-xl lg:text-lg">
                        {footer.headline}
                      </h3>
                    ) : null}
                    {footer.subheadline ? (
                      <p className="vbiz-about-footer-sub md:text-md text-base font-bold">{footer.subheadline}</p>
                    ) : null}
                  </div>

                  {footer.tagline ? (
                    <p className="vbiz-about-tagline text-center text-sm leading-snug font-semibold tracking-widest uppercase md:text-left md:text-base">
                      {footer.tagline}
                    </p>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </V3SectionShell>
  )
}
