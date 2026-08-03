'use client'

import { Loader2, Volume2, VolumeX } from 'lucide-react'
import { motion } from 'motion/react'
import { type MouseEvent, useEffect, useRef, useState } from 'react'
import { ProfileIntroVideo } from './ProfileIntroVideo'

const DEFAULT_UNMUTE_VOLUME = 0.5
/** Require nearly full buffer before revealing (smooth playback, no mid-stream stalls). */
const READY_BUFFER_FRACTION = 0.98
/** Safety net for very slow networks only — prefer full buffer / canplaythrough. */
const READY_MAX_WAIT_MS = 12000

const SPLIT_COUNT = 3
const SPLIT_STAGGER_S = 0.14
const SPLIT_DURATION_S = 0.58
const SPLIT_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

type Props = {
  videoUrl: string
  onSkip: () => void
  skipLabel?: string
}

export function ProfileIntroPreloader({ videoUrl, onSkip, skipLabel = 'Skip intro' }: Props) {
  const src = videoUrl.trim()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [volume, setVolume] = useState(0)
  const [ready, setReady] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const [curtainsDone, setCurtainsDone] = useState(false)

  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtmlOverflow = html.style.overflow
    const prevBodyOverflow = body.style.overflow

    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'

    return () => {
      html.style.overflow = prevHtmlOverflow
      body.style.overflow = prevBodyOverflow
    }
  }, [])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setReady(false)
      setRevealed(false)
      setCurtainsDone(false)
    }, 0)
    return () => window.clearTimeout(timer)
  }, [src])

  // Buffer fully, then reveal and play — avoids flicker from partial loads.
  useEffect(() => {
    const el = videoRef.current
    if (!el) return

    let done = false
    const markReady = () => {
      if (done) return
      done = true
      setReady(true)
    }

    const onProgress = () => {
      try {
        if (el.duration > 0 && el.buffered.length > 0) {
          const bufferedEnd = el.buffered.end(el.buffered.length - 1)
          if (bufferedEnd / el.duration >= READY_BUFFER_FRACTION) markReady()
        }
      } catch {
        /* buffered ranges not ready yet */
      }
    }

    el.addEventListener('canplaythrough', markReady)
    el.addEventListener('progress', onProgress)
    el.addEventListener('loadeddata', onProgress)
    const timer = window.setTimeout(markReady, READY_MAX_WAIT_MS)

    return () => {
      el.removeEventListener('canplaythrough', markReady)
      el.removeEventListener('progress', onProgress)
      el.removeEventListener('loadeddata', onProgress)
      window.clearTimeout(timer)
    }
  }, [src])

  useEffect(() => {
    if (!ready) return
    const el = videoRef.current
    if (!el) return

    void el.play().catch(() => undefined)
    const revealTimer = window.setTimeout(() => setRevealed(true), 50)
    return () => window.clearTimeout(revealTimer)
  }, [ready])

  const applyVolume = (nextVolume: number) => {
    const el = videoRef.current
    if (!el) return

    const clamped = Math.max(0, Math.min(1, nextVolume))
    el.volume = clamped
    setVolume(clamped)

    if (clamped === 0) {
      el.muted = true
      setIsMuted(true)
      return
    }

    el.muted = false
    setIsMuted(false)
  }

  const toggleMute = () => {
    const el = videoRef.current
    if (!el) return

    if (isMuted) {
      const nextVolume = volume > 0 ? volume : DEFAULT_UNMUTE_VOLUME
      applyVolume(nextVolume)
      return
    }

    el.muted = true
    setIsMuted(true)
  }

  const handleVolumeSeek = (e: MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const nextVolume = (e.clientX - rect.left) / rect.width
    applyVolume(nextVolume)
  }

  if (!src) return null

  const volumePercent = Math.round(volume * 100)

  return (
    <div
      className="vbiz-theme-scope fixed inset-0 z-200 overflow-hidden bg-black text-white"
      style={{ width: '100dvw', height: '100dvh' }}
    >
      <ProfileIntroVideo
        ref={videoRef}
        src={src}
        shouldPlay={ready}
        className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 md:object-contain ${
          revealed ? 'opacity-100' : 'opacity-0'
        }`}
        onEnded={onSkip}
      />

      {/* Three vertical splits — each curtain drops top→bottom (100% → 0% height) with stagger */}
      {!curtainsDone ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex">
          {Array.from({ length: SPLIT_COUNT }, (_, index) => (
            <div key={index} className="relative h-full min-w-0 flex-1 overflow-hidden">
              <motion.div
                className="absolute inset-x-0 top-0 bg-black"
                initial={{ height: '100%' }}
                animate={{ height: revealed ? '0%' : '100%' }}
                transition={{
                  duration: SPLIT_DURATION_S,
                  delay: revealed ? index * SPLIT_STAGGER_S : 0,
                  ease: SPLIT_EASE,
                }}
                onAnimationComplete={() => {
                  if (revealed && index === SPLIT_COUNT - 1) setCurtainsDone(true)
                }}
              />
            </div>
          ))}
        </div>
      ) : null}

      {!revealed ? (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/80">
          <Loader2 size={32} className="vbiz-pin animate-spin opacity-70" />
          <p className="vbiz-description mt-3 text-xs font-medium tracking-wide">Loading intro…</p>
        </div>
      ) : null}

      <div className="absolute right-4 bottom-4 z-30 flex items-center gap-3 sm:right-6 sm:bottom-6">
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${isMuted ? 'max-w-0 opacity-0' : 'max-w-40 opacity-100 sm:max-w-48'}`}
          aria-hidden={isMuted}
        >
          <div
            role="slider"
            tabIndex={isMuted ? -1 : 0}
            aria-label="Intro video volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={volumePercent}
            onClick={handleVolumeSeek}
            onKeyDown={(e) => {
              if (isMuted) return
              if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
                e.preventDefault()
                applyVolume(volume - 0.05)
              }
              if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
                e.preventDefault()
                applyVolume(volume + 0.05)
              }
            }}
            className="group/vol relative h-1.5 w-28 cursor-pointer overflow-hidden rounded-full bg-white/20 sm:w-36"
          >
            <div
              className="absolute top-0 left-0 h-full bg-white transition-[width] duration-100 ease-linear"
              style={{ width: `${volumePercent}%` }}
            />
          </div>
        </div>

        <button
          type="button"
          onClick={toggleMute}
          disabled={!revealed}
          aria-label={isMuted ? 'Unmute intro video' : 'Mute intro video'}
          className="vbiz-preloader-btn flex h-11 w-11 shrink-0 items-center justify-center border transition-colors disabled:opacity-40"
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>

        <button
          type="button"
          onClick={onSkip}
          className="vbiz-preloader-btn shrink-0 border px-5 py-2.5 text-sm font-semibold transition-colors"
        >
          {skipLabel}
        </button>
      </div>
    </div>
  )
}
