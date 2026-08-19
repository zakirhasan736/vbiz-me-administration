'use client'

import { encodeMediaUrl, isUsableImageSrc, isVideoUrl } from '@/lib/mediaUrl'
import { TruncatedClampText } from '@/profile-app/components/TruncatedClampText'
import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { V3EmptyState, V3ErrorState, V3SectionShell } from '@/profile-app/sections'
import { useGetAboutMeQuery } from '@/redux/api'
import { BookOpen, Flag, Lightbulb, Quote, Sparkles, Target, Users } from 'lucide-react'
import Image from 'next/image'

const FIXED_SECTION_TITLE = 'About Me'

const PILLAR_ICONS = [Lightbulb, Target, Users, Flag] as const
const PILLAR_COLORS = [
  { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
  { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
  { color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
  { color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-500/10' },
] as const

const ABOUT_INTRO_PROSE =
  'vcard-rich-html prose prose-invert prose-sm md:prose-base relative max-w-2xl pl-2 leading-relaxed font-medium text-zinc-300 ' +
  '[&_a]:text-gold [&_a]:underline-offset-2 hover:[&_a]:underline ' +
  '[&_h1]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h1]:text-white ' +
  '[&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-bold [&_h2]:text-white ' +
  '[&_h3]:mb-2 [&_h3]:text-base [&_h3]:font-bold [&_h3]:text-white ' +
  '[&_p]:mb-3 [&_p]:leading-relaxed ' +
  '[&_strong]:font-bold [&_strong]:text-white ' +
  '[&_em]:italic ' +
  '[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-5 ' +
  '[&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-5 ' +
  '[&_li]:mb-1 ' +
  '[&_blockquote]:border-gold/40 [&_blockquote]:border-l-2 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-400'

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

function AboutHeroBackground({ src, alt }: { src: string; alt: string }) {
  const encoded = encodeMediaUrl(src)
  if (!encoded) {
    return <div className="bg-ocean-deep h-full w-full" />
  }

  if (isVideoUrl(encoded)) {
    return (
      <video
        src={encoded}
        className="h-full w-full scale-105 object-cover object-top opacity-90 mix-blend-luminosity"
        autoPlay
        muted
        loop
        playsInline
        aria-label={alt}
      />
    )
  }

  if (!isUsableImageSrc(encoded)) {
    return <div className="bg-ocean-deep h-full w-full" />
  }

  return (
    <Image
      src={encoded}
      alt={alt}
      fill
      className="scale-105 object-cover object-top opacity-90 mix-blend-luminosity"
      sizes="100vw"
      priority
    />
  )
}

export const AboutSection = () => {
  const { cardOwnerId, personal, embedded } = useProfileDisplay()
  const compact = embedded
  const profileId = cardOwnerId?.trim() ?? ''

  const { data, isLoading, isFetching, isError } = useGetAboutMeQuery(profileId, { skip: !profileId })

  // Section chrome is always "About Me" — never the editable headline.
  const sectionTitle = FIXED_SECTION_TITLE
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
  const { lead: titleLead, accent: titleAccent } = splitSectionTitle(sectionTitle)
  const hasIntro = Boolean(item && (hasIntroHtml || item.plainDescription))
  const ownerInitial = personal.fullName?.trim().charAt(0).toUpperCase() || ''

  return (
    <V3SectionShell>
      <div className="flex flex-col gap-4 md:gap-6">
        <div className="vbiz-hero-banner bg-ocean-deep dark:border-gold/20 relative flex min-h-70 w-full flex-col overflow-hidden rounded-4xl border border-zinc-800 shadow-xl sm:min-h-75 md:min-h-85 md:rounded-[2.5rem]">
          <div className="absolute inset-0 z-0 h-full w-full">
            {heroImage ? (
              <AboutHeroBackground src={heroImage} alt={headline || sectionTitle} />
            ) : (
              <div className="bg-ocean-deep h-full w-full" />
            )}
            <div className="from-ocean-deep via-ocean-deep/80 to-ocean-deep/30 absolute inset-0 bg-linear-to-t" />
            <div className="from-ocean-deep via-ocean-deep/50 absolute inset-0 hidden bg-linear-to-r to-transparent md:block md:w-2/3" />
          </div>

          {ownerInitial ? (
            <div className={`absolute z-20 ${compact ? 'top-3 right-3' : 'top-4 right-4 md:top-6 md:right-6'}`}>
              <div className="border-gold/30 flex h-10 w-10 flex-col items-center justify-center rounded-xl border bg-black/40 shadow-2xl backdrop-blur-xl md:h-12 md:w-12">
                <span className="mb-0.5 font-serif text-lg font-black tracking-tighter text-white drop-shadow-md md:text-2xl">
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
            <div className="mt-auto flex max-w-3xl flex-col gap-3 pt-14 sm:gap-4 sm:pt-0 md:gap-4">
              <div className="vbiz-hero-eyebrow vbiz-eyebrow self-start shadow-sm backdrop-blur-md md:text-xs">
                <Sparkles size={14} className="text-gold" /> {sectionTitle}
              </div>

              <h2 className="vbiz-hero-title text-2xl leading-[1.15] font-black tracking-tight text-white sm:text-3xl md:text-4xl lg:text-4xl">
                {titleAccent ? (
                  <>
                    {titleLead}{' '}
                    <span className="from-gold bg-linear-to-r to-yellow-500 bg-clip-text text-transparent">
                      {titleAccent}
                    </span>
                  </>
                ) : (
                  sectionTitle
                )}
              </h2>

              {showHeadline ? (
                <p className="vbiz-hero-subtitle text-gold/90 max-w-2xl text-base leading-snug font-bold md:text-xl">
                  {headline}
                </p>
              ) : null}

              {isAboutPending ? (
                <AboutIntroSkeleton />
              ) : hasIntro && item ? (
                <div className="relative">
                  <Quote className="text-gold/10 absolute -top-3 -left-3 -rotate-12" size={32} />
                  <TruncatedClampText
                    html={hasIntroHtml ? item.introHtml : undefined}
                    plain={!hasIntroHtml ? item.plainDescription : undefined}
                    maxLines={5}
                    minLength={180}
                    accentColor="#eed677"
                    seeMoreLabel="See more"
                    seeLessLabel="See less"
                    readMoreLabel="See more"
                    readLessLabel="See less"
                    className="relative z-10"
                    textClassName={
                      hasIntroHtml
                        ? ABOUT_INTRO_PROSE
                        : 'relative max-w-2xl pl-2 text-sm leading-relaxed font-medium text-zinc-300 md:text-lg'
                    }
                  />
                </div>
              ) : null}

              {highlight ? (
                <div className="text-base leading-relaxed font-medium text-white md:text-base lg:text-base">
                  {highlight.title ? (
                    <span className="vbiz-hero-heading mb-1 block text-xl font-semibold tracking-tight text-white md:mb-1 md:text-xl">
                      {highlight.title}
                    </span>
                  ) : null}
                  {highlight.html ? (
                    <div
                      className="vcard-rich-html text-white [&_p]:mb-0 [&_strong]:font-medium"
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
                    const palette = PILLAR_COLORS[idx % PILLAR_COLORS.length]
                    return (
                      <div
                        key={`${pillar.title}-${idx}`}
                        className="vbiz-hero-card group hover:border-gold/30 flex gap-3 rounded-3xl border border-zinc-200 bg-white p-3 shadow-sm transition-colors md:rounded-xl md:p-3 dark:border-zinc-800/80 dark:bg-[#031327]"
                      >
                        <div
                          className={`h-9 w-9 rounded-xl p-2 ${palette.bg} ${palette.color} transition-transform duration-300 group-hover:scale-110`}
                        >
                          <Icon size={16} strokeWidth={2.5} />
                        </div>
                        <div>
                          <h4 className="mb-1 text-sm font-bold text-zinc-900 md:text-base dark:text-zinc-100">
                            {pillar.title}
                          </h4>
                          {pillar.description ? (
                            <p className="text-xs leading-snug font-medium text-zinc-500 md:text-sm dark:text-zinc-400">
                              {pillar.description}
                            </p>
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
                      <h3 className="vbiz-hero-heading text-md mb-1 font-semibold tracking-tight text-white md:mb-1 md:text-xl lg:text-lg">
                        {footer.headline}
                      </h3>
                    ) : null}
                    {footer.subheadline ? (
                      <p className="md:text-md text-base font-bold text-zinc-400">{footer.subheadline}</p>
                    ) : null}
                  </div>

                  {footer.tagline ? (
                    <p className="text-gold text-center text-sm leading-snug font-semibold tracking-widest uppercase md:text-left md:text-base">
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
