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
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type MouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'

const DEFAULT_UNMUTE_VOLUME = 0.5

type Props = {
  audio?: MyCardBackgroundAudio | null
  design?: ResolvedProfileDesign | null
  embedded?: boolean
  readyToPlay?: boolean
}

function postYoutubeCommand(iframe: HTMLIFrameElement, func: string, args: unknown[] = []) {
  iframe.contentWindow?.postMessage(JSON.stringify({ event: 'command', func, args }), '*')
}

export function BackgroundAudio({ audio, design, embedded = false, readyToPlay = true }: Props) {
  const source = resolveBackgroundAudioSource(audio)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(DEFAULT_UNMUTE_VOLUME)
  const audioRef = useRef<HTMLAudioElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const sourceRef = useRef<BackgroundAudioSource | null>(source)
  const volumeRef = useRef(volume)
  const iframeId = useId().replace(/:/g, '')

  const accentColor = design?.accentColor ?? design?.primaryColor

  useEffect(() => {
    sourceRef.current = source
  }, [source])

  useEffect(() => {
    volumeRef.current = volume
  }, [volume])

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

  const ensurePlaying = useCallback(async () => {
    const activeSource = sourceRef.current
    if (!activeSource) return

    if (activeSource.type === 'file') {
      const el = audioRef.current
      if (!el || !el.paused) return
      try {
        await el.play()
      } catch {
        /* playback blocked */
      }
      return
    }

    const iframe = iframeRef.current
    if (iframe) postYoutubeCommand(iframe, 'playVideo')
  }, [])

  const applyVolume = useCallback(
    (nextVolume: number) => {
      const activeSource = sourceRef.current
      if (!activeSource) return

      const clamped = Math.max(0, Math.min(1, nextVolume))
      setVolume(clamped)

      if (activeSource.type === 'file') {
        const el = audioRef.current
        if (!el) return
        el.volume = clamped
        if (clamped === 0) {
          el.muted = true
          setIsMuted(true)
          return
        }
        el.muted = false
        setIsMuted(false)
        void ensurePlaying()
        return
      }

      const iframe = iframeRef.current
      if (!iframe) return
      postYoutubeCommand(iframe, 'setVolume', [Math.round(clamped * 100)])
      if (clamped === 0) {
        postYoutubeCommand(iframe, 'mute')
        setIsMuted(true)
        return
      }
      postYoutubeCommand(iframe, 'unMute')
      setIsMuted(false)
      void ensurePlaying()
    },
    [ensurePlaying]
  )

  const startPlayback = useCallback(async () => {
    const activeSource = sourceRef.current
    if (!readyToPlay || !activeSource) return

    const level = volumeRef.current

    if (activeSource.type === 'file') {
      const el = audioRef.current
      if (!el) return
      el.volume = level
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
    postYoutubeCommand(iframe, 'setVolume', [Math.round(level * 100)])
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
    if (!source) return
    if (readyToPlay) {
      void startPlayback()
      return
    }
    // Hidden/minimized preview: stop the media instead of letting it run unseen.
    const el = audioRef.current
    if (el && !el.paused) el.pause()
    const iframe = iframeRef.current
    if (iframe) postYoutubeCommand(iframe, 'pauseVideo')
  }, [readyToPlay, source, startPlayback])

  const toggleMute = useCallback(() => {
    const activeSource = sourceRef.current
    if (!activeSource) return

    if (isMuted) {
      applyVolume(volume > 0 ? volume : DEFAULT_UNMUTE_VOLUME)
      return
    }

    if (activeSource.type === 'file') {
      const el = audioRef.current
      if (!el) return
      el.muted = true
      setIsMuted(true)
      return
    }

    const iframe = iframeRef.current
    if (!iframe) return
    postYoutubeCommand(iframe, 'mute')
    setIsMuted(true)
  }, [applyVolume, isMuted, volume])

  const volumeFromPointer = useCallback(
    (clientY: number, track: HTMLElement) => {
      const rect = track.getBoundingClientRect()
      if (rect.height <= 0) return
      applyVolume(1 - (clientY - rect.top) / rect.height)
    },
    [applyVolume]
  )

  const handleVolumeSeek = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      e.stopPropagation()
      volumeFromPointer(e.clientY, e.currentTarget)
    },
    [volumeFromPointer]
  )

  const handleVolumePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      e.preventDefault()
      e.stopPropagation()
      const track = e.currentTarget
      track.setPointerCapture(e.pointerId)
      volumeFromPointer(e.clientY, track)

      const onMove = (ev: PointerEvent) => volumeFromPointer(ev.clientY, track)
      const onUp = () => {
        track.releasePointerCapture(e.pointerId)
        track.removeEventListener('pointermove', onMove)
        track.removeEventListener('pointerup', onUp)
        track.removeEventListener('pointercancel', onUp)
      }
      track.addEventListener('pointermove', onMove)
      track.addEventListener('pointerup', onUp)
      track.addEventListener('pointercancel', onUp)
    },
    [volumeFromPointer]
  )

  if (!isBackgroundAudioAvailable(audio) || !source) return null

  const youtubeSrc =
    source.type === 'youtube'
      ? buildYoutubeEmbedUrl(source, {
          origin: typeof window !== 'undefined' ? window.location.origin : undefined,
        })
      : undefined

  const volumePercent = Math.round(volume * 100)

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

      <div
        className={cn(
          'z-100 flex flex-col items-center gap-2',
          embedded ? 'absolute bottom-18 left-3 md:bottom-4 md:left-4' : 'fixed bottom-20 left-4 md:bottom-6 md:left-6'
        )}
      >
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-out',
            isMuted ? 'max-h-0 opacity-0' : 'max-h-24 opacity-100'
          )}
          aria-hidden={isMuted}
        >
          <div
            role="slider"
            tabIndex={isMuted ? -1 : 0}
            aria-label="Background audio volume"
            aria-orientation="vertical"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volumePercent}
            onClick={handleVolumeSeek}
            onPointerDown={handleVolumePointerDown}
            onKeyDown={(e) => {
              if (isMuted) return
              if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') {
                e.preventDefault()
                applyVolume(volume - 0.05)
              }
              if (e.key === 'ArrowUp' || e.key === 'ArrowRight') {
                e.preventDefault()
                applyVolume(volume + 0.05)
              }
            }}
            className="group/vol relative flex h-20 w-8 cursor-pointer touch-none items-end justify-center py-1"
          >
            <div className="relative h-full w-1.5 overflow-hidden rounded-full bg-zinc-300/70 dark:bg-zinc-600/70">
              <div
                className="absolute inset-x-0 bottom-0 rounded-full bg-zinc-700 transition-[height] duration-100 ease-linear dark:bg-zinc-200"
                style={{
                  height: `${volumePercent}%`,
                  backgroundColor: accentColor || undefined,
                }}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          aria-label={isMuted ? 'Unmute background audio' : 'Mute background audio'}
          aria-pressed={!isMuted}
          className={cn(
            'flex items-center justify-center rounded-full border backdrop-blur-md transition-all active:scale-95',
            'h-7.75 w-7.75 md:h-11 md:w-11',
            isMuted
              ? 'border-zinc-300/60 bg-white/85 text-zinc-500 shadow-sm dark:border-zinc-700/70 dark:bg-zinc-900/85 dark:text-zinc-400'
              : 'border-zinc-300/80 bg-white/95 text-zinc-800 shadow-md dark:border-zinc-600 dark:bg-zinc-800/95 dark:text-zinc-100'
          )}
          style={!isMuted && accentColor ? { borderColor: `${accentColor}66`, color: accentColor } : undefined}
        >
          {isMuted ? (
            <VolumeX className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" strokeWidth={2} />
          ) : (
            <Volume2 className="h-3.5 w-3.5 md:h-4.5 md:w-4.5" strokeWidth={2} />
          )}
        </button>
      </div>
    </>
  )
}
