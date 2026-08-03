'use client'

import { useProfileDisplay } from '@/profile-app/lib/profileDisplayContext'
import { useGetVideoExplainerQuery } from '@/redux/api'
import { ExternalLink, PlayCircle, Video } from 'lucide-react'
import { useRef } from 'react'

function ExplainerSectionSkeleton() {
  return (
    <div className="w-full pb-20">
      <div className="min-h-[520px] animate-pulse rounded-3xl border border-zinc-200 bg-zinc-200 dark:border-zinc-800/80 dark:bg-zinc-800" />
    </div>
  )
}

export const ExplainerSection = () => {
  const { cardOwnerId } = useProfileDisplay()
  const profileId = cardOwnerId?.trim() ?? ''
  const videoRef = useRef<HTMLVideoElement>(null)

  const { data, isLoading, isError } = useGetVideoExplainerQuery(profileId, { skip: !profileId })

  const sectionTitle = data?.sectionTitle ?? '2D Video Explainer'
  const videoUrl = data?.videoUrl ?? ''
  const externalUrl = data?.externalUrl ?? null
  const hasVideo = Boolean(videoUrl)
  const showInitialLoader = isLoading && !hasVideo && !externalUrl
  const showEmptyState = !isLoading && !isError && !hasVideo && !externalUrl

  const handlePlayVideo = () => {
    const video = videoRef.current
    if (!video) return
    void video.play().catch(() => undefined)
    video.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  if (!profileId) return null

  if (showInitialLoader) {
    return <ExplainerSectionSkeleton />
  }

  if (isError) {
    return (
      <div className="w-full pb-20">
        <div className="rounded-3xl border border-red-200 bg-red-50/80 px-6 py-8 text-center text-sm font-medium text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          Unable to load {sectionTitle.toLowerCase()} right now. Please try again later.
        </div>
      </div>
    )
  }

  if (showEmptyState) {
    return (
      <div className="w-full pb-20">
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-3xl border border-dashed border-zinc-200 bg-white/40 p-10 text-center dark:border-zinc-800/80 dark:bg-zinc-900/30">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-200 bg-zinc-100 text-[#eab308] dark:border-zinc-700 dark:bg-zinc-800/80">
            <Video size={24} />
          </div>
          <h2 className="mb-3 text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{sectionTitle}</h2>
          <p className="max-w-md text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400">
            No explainer video has been published yet. Add a video from the vCard editor.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full pb-20">
      <div className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white/50 p-4 backdrop-blur-xl dark:border-zinc-800/80 dark:bg-zinc-900/50">
        <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-zinc-100/50 to-transparent dark:from-zinc-800/20" />
        <div className="bg-yellow-primary/10 dark:bg-yellow-primary/5 pointer-events-none absolute top-0 right-0 -mt-32 -mr-32 rounded-full p-32 blur-3xl transition-transform duration-1000 group-hover:scale-110" />

        {hasVideo ? (
          <div className="relative z-10 mb-6 h-[300px] w-full overflow-hidden rounded-2xl border border-zinc-200 bg-black md:h-[450px] lg:h-[500px] dark:border-zinc-800/80">
            <video
              ref={videoRef}
              key={videoUrl}
              src={videoUrl}
              className="h-full w-full object-contain"
              controls
              playsInline
              preload="metadata"
            />
          </div>
        ) : externalUrl ? (
          <div className="relative z-10 mb-6 flex h-[300px] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 md:h-[450px] lg:h-[500px] dark:border-zinc-800/80 dark:bg-zinc-950">
            <Video size={48} className="text-yellow-primary" />
            <p className="max-w-md px-6 text-center text-sm font-medium text-zinc-600 dark:text-zinc-400">
              This explainer is hosted externally. Open it in a new tab to watch.
            </p>
          </div>
        ) : null}

        <div className="relative z-10 flex flex-col items-start justify-between gap-6 px-2 pb-2 md:flex-row md:items-center lg:px-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-100 px-3 py-1.5 text-[10px] font-bold tracking-wider text-zinc-600 uppercase shadow-sm backdrop-blur-sm transition-colors dark:border-zinc-700/50 dark:bg-zinc-800/80 dark:text-zinc-300">
            <PlayCircle size={12} className="text-yellow-primary" /> {sectionTitle}
          </div>

          <div className="flex w-full shrink-0 flex-col gap-3 sm:flex-row md:w-auto">
            {hasVideo ? (
              <button
                type="button"
                onClick={handlePlayVideo}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-colors hover:bg-zinc-800 hover:shadow-[0_0_20px_rgba(0,0,0,0.1)] active:scale-95 sm:w-auto dark:bg-zinc-100 dark:text-zinc-950 dark:hover:bg-white dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.2)]"
              >
                <PlayCircle size={18} /> Play Video
              </button>
            ) : null}

            {externalUrl ? (
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-6 py-3.5 text-sm font-bold text-zinc-900 transition-colors hover:bg-zinc-200 active:scale-95 sm:w-auto dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
              >
                <ExternalLink size={18} /> Watch Externally
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}
