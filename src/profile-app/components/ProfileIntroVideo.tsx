'use client'

import { withVideoStartHint } from '@/profile-app/lib/introVideoAdaptive'
import { forwardRef, useEffect, useMemo, useRef } from 'react'

type Props = {
  src: string
  className?: string
  onEnded?: () => void
  shouldPlay?: boolean
  /** When false, keep audio unmuted (do not re-apply iOS mute flags). */
  muted?: boolean
  onCanPlay?: () => void
  onPlaying?: () => void
  onWaiting?: () => void
  onError?: () => void
  onPlayError?: () => void
  qualityLabel?: string
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (value: T | null) => {
    for (const ref of refs) {
      if (typeof ref === 'function') ref(value)
      else if (ref) (ref as React.MutableRefObject<T | null>).current = value
    }
  }
}

function applyIosPlayFlags(el: HTMLVideoElement, muted: boolean) {
  el.playsInline = true
  el.setAttribute('playsinline', '')
  el.setAttribute('webkit-playsinline', 'true')
  el.setAttribute('x5-playsinline', 'true')
  el.setAttribute('autoplay', '')
  // Prefer early decode over waiting for a deep buffer on Safari.
  try {
    el.setAttribute('preload', 'auto')
  } catch {
    /* ignore */
  }
  if (muted) {
    el.muted = true
    el.defaultMuted = true
    el.setAttribute('muted', '')
  } else {
    el.muted = false
    el.defaultMuted = false
    el.removeAttribute('muted')
  }
}

/**
 * Intro preloader video — muted + playsInline for iOS Safari autoplay
 * (including Low Power Mode, which often needs a later tap to start).
 * After the visitor unmutes, muted stays false so retry/autoplay does not silence audio.
 */
export const ProfileIntroVideo = forwardRef<HTMLVideoElement, Props>(function ProfileIntroVideo(
  {
    src,
    className,
    onEnded,
    shouldPlay = false,
    muted = true,
    onCanPlay,
    onPlaying,
    onWaiting,
    onError,
    onPlayError,
    qualityLabel,
  },
  forwardedRef
) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const onPlayErrorRef = useRef(onPlayError)
  const mutedRef = useRef(muted)
  onPlayErrorRef.current = onPlayError
  mutedRef.current = muted

  // `#t=0.001` nudges Safari to paint a first frame without a large buffer.
  const playbackSrc = useMemo(() => withVideoStartHint(src), [src])

  useEffect(() => {
    const el = internalRef.current
    if (!el) return

    applyIosPlayFlags(el, muted)

    if (!shouldPlay) {
      el.pause()
      return
    }

    const tryPlay = () => {
      applyIosPlayFlags(el, mutedRef.current)
      const playResult = el.play()
      if (playResult && typeof playResult.then === 'function') {
        void playResult.catch(() => onPlayErrorRef.current?.())
      }
    }

    // Force the network stack to start immediately on Safari.
    try {
      el.load()
    } catch {
      /* ignore */
    }
    tryPlay()
    el.addEventListener('loadedmetadata', tryPlay)
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('canplay', tryPlay)
    el.addEventListener('canplaythrough', tryPlay)

    return () => {
      el.removeEventListener('loadedmetadata', tryPlay)
      el.removeEventListener('loadeddata', tryPlay)
      el.removeEventListener('canplay', tryPlay)
      el.removeEventListener('canplaythrough', tryPlay)
    }
  }, [playbackSrc, shouldPlay, muted])

  return (
    <video
      ref={mergeRefs(internalRef, forwardedRef)}
      className={className}
      src={playbackSrc}
      muted={muted}
      autoPlay
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      data-intro-quality={qualityLabel}
      onEnded={onEnded}
      onCanPlay={onCanPlay}
      onPlaying={onPlaying}
      onWaiting={onWaiting}
      onError={onError}
      {...{
        'webkit-playsinline': 'true',
        'x5-playsinline': 'true',
      }}
    />
  )
})
