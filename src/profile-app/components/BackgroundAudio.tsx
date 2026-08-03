'use client'

import {
  buildYoutubeEmbedUrl,
  isBackgroundAudioAvailable,
  resolveBackgroundAudioSource,
  type BackgroundAudioSource,
} from '@/lib/backgroundAudio/resolveBackgroundAudio'
import type { ResolvedProfileDesign } from '@/lib/resolvedProfileDesign'
import { cn } from '@/utils/cn'
import type { MyCardBackgroundAudio } from '@interfaces/api/myCard'
import { Volume2, VolumeX } from 'lucide-react'
import { useCallback, useEffect, useId, useRef, useState } from 'react'

type Props = {
  audio?: MyCardBackgroundAudio | null
  design?: ResolvedProfileDesign | null
  embedded?: boolean
  readyToPlay?: boolean
}

function postYoutubeCommand(iframe: HTMLIFrameElement, func: string) {
  iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args: [] }), '*')
}

export function BackgroundAudio({ audio, design, embedded = false, readyToPlay = true }: Props) {
  const source = resolveBackgroundAudioSource(audio)
  const [isMuted, setIsMuted] = useState(true)
  const audioRef = useRef<HTMLAudioElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sourceRef = useRef<BackgroundAudioSource | null>(source)
  const iframeId = useId().replace(/:/g, '')

  const accentColor = design?.accentColor ?? design?.primaryColor

  useEffect(() => {
    sourceRef.current = source
  }, [source])

  const bindFilePlayback = useCallback(
    (el: HTMLAudioElement, activeSource: Extract<BackgroundAudioSource, { type: 'file' }>) => {
      const onLoaded = () => {
        if (activeSource.startTime > 0) {
          el.currentTime = activeSource.startTime
        }
      }

      const onTimeUpdate = () => {
        if (activeSource.endTime == null || el.currentTime < activeSource.endTime) return
        if (activeSource.loop) {
          el.currentTime = activeSource.startTime
          void el.play().catch(() => undefined)
          return
        }
        el.pause()
      }

      el.addEventListener('loadedmetadata', onLoaded)
      el.addEventListener('timeupdate', onTimeUpdate)

      if (el.readyState >= 1) onLoaded()

      return () => {
        el.removeEventListener('loadedmetadata', onLoaded)
        el.removeEventListener('timeupdate', onTimeUpdate)
      }
    },
    []
  )

  const startPlayback = useCallback(async () => {
    const activeSource = sourceRef.current
    if (!readyToPlay || !activeSource) return

    if (activeSource.type === 'file') {
      const el = audioRef.current
      if (!el) return
      el.muted = true
      try {
        if (el.paused) await el.play()
      } catch {
        /* autoplay blocked until user gesture */
      }
      return
    }

    const iframe = iframeRef.current
    if (!iframe) return
    postYoutubeCommand(iframe, 'mute')
    postYoutubeCommand(iframe, 'playVideo')
  }, [readyToPlay])

  useEffect(() => {
    if (!isBackgroundAudioAvailable(audio) || !source) return

    if (source.type === 'file') {
      const el = audioRef.current
      if (!el) return
      return bindFilePlayback(el, source)
    }

    return undefined
  }, [audio, source, bindFilePlayback])

  useEffect(() => {
    if (!readyToPlay || !source) return
    void startPlayback()
  }, [readyToPlay, source, startPlayback])

  const toggleMute = useCallback(async () => {
    const activeSource = sourceRef.current
    if (!activeSource) return

    const nextMuted = !isMuted
    setIsMuted(nextMuted)

    if (activeSource.type === 'file') {
      const el = audioRef.current
      if (!el) return
      el.muted = nextMuted
      if (!nextMuted && el.paused) {
        try {
          await el.play()
        } catch {
          /* playback blocked */
        }
      }
      return
    }

    const iframe = iframeRef.current
    if (!iframe) return
    postYoutubeCommand(iframe, nextMuted ? 'mute' : 'unMute')
    if (!nextMuted) postYoutubeCommand(iframe, 'playVideo')
  }, [isMuted])

  if (!isBackgroundAudioAvailable(audio) || !source) return null

  const youtubeSrc =
    source.type === 'youtube'
      ? buildYoutubeEmbedUrl(source, {
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        })
      : undefined

  return (
    <>
      {source.type === 'file' ? (
        <audio
          ref={audioRef}
          src={source.src}
          loop={source.loop && source.endTime == null}
          preload="auto"
          playsInline
          className="hidden"
          aria-hidden
        />
      ) : (
        <iframe
          ref={iframeRef}
          id={iframeId}
          title="Background audio"
          src={youtubeSrc}
          allow="autoplay; encrypted-media"
          className="pointer-events-none absolute left-[-9999px] h-px w-px opacity-0"
          aria-hidden
        />
      )}

      <button
        type="button"
        onClick={() => void toggleMute()}
        aria-label={isMuted ? 'Unmute background audio' : 'Mute background audio'}
        aria-pressed={!isMuted}
        className={cn(
          'flex h-11 w-11 items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95',
          embedded ? 'absolute bottom-4 left-4 z-50' : 'fixed bottom-6 left-6 z-100',
          isMuted
            ? 'border-zinc-300/60 bg-white/85 text-zinc-500 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:text-zinc-400'
            : 'border-zinc-300/80 bg-white/95 text-zinc-800 shadow-md dark:border-zinc-600 dark:bg-zinc-800/95 dark:text-zinc-100'
        )}
        style={!isMuted && accentColor ? { borderColor: `${accentColor}66`, color: accentColor } : undefined}
      >
        {isMuted ? <VolumeX size={18} strokeWidth={2} /> : <Volume2 size={18} strokeWidth={2} />}
      </button>
    </>
  )
}
