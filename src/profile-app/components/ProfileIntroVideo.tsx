'use client'

import { forwardRef, useEffect, useRef } from 'react'

type Props = {
  src: string
  className?: string
  onEnded?: () => void
  shouldPlay?: boolean
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

function applyIosVideoFlags(el: HTMLVideoElement) {
  el.muted = true
  el.defaultMuted = true
  el.playsInline = true
  el.setAttribute('muted', '')
  el.setAttribute('autoplay', '')
  el.setAttribute('playsinline', '')
  el.setAttribute('webkit-playsinline', 'true')
  el.setAttribute('x5-playsinline', 'true')
}

/**
 * Intro preloader video — muted + playsInline for iOS Safari autoplay
 * (including Low Power Mode, which often needs a later tap to start).
 */
export const ProfileIntroVideo = forwardRef<HTMLVideoElement, Props>(function ProfileIntroVideo(
  { src, className, onEnded, shouldPlay = false, onCanPlay, onPlaying, onWaiting, onError, onPlayError, qualityLabel },
  forwardedRef
) {
  const internalRef = useRef<HTMLVideoElement>(null)
  const onPlayErrorRef = useRef(onPlayError)
  onPlayErrorRef.current = onPlayError

  useEffect(() => {
    const el = internalRef.current
    if (!el) return

    applyIosVideoFlags(el)

    if (!shouldPlay) {
      el.pause()
      return
    }

    const tryPlay = () => {
      applyIosVideoFlags(el)
      const playResult = el.play()
      if (playResult && typeof playResult.then === 'function') {
        void playResult.catch(() => onPlayErrorRef.current?.())
      }
    }

    tryPlay()
    el.addEventListener('loadedmetadata', tryPlay)
    el.addEventListener('loadeddata', tryPlay)
    el.addEventListener('canplay', tryPlay)

    return () => {
      el.removeEventListener('loadedmetadata', tryPlay)
      el.removeEventListener('loadeddata', tryPlay)
      el.removeEventListener('canplay', tryPlay)
    }
  }, [src, shouldPlay])

  const type = /\.webm(\?|#|$)/i.test(src) ? 'video/webm' : 'video/mp4'

  return (
    <video
      ref={mergeRefs(internalRef, forwardedRef)}
      className={className}
      src={src}
      muted
      autoPlay
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      data-intro-quality={qualityLabel}
      onEnded={onEnded}
      onCanPlay={onCanPlay}
      onPlaying={onPlaying}
      onWaiting={onWaiting}
      onError={onError}
      // Older WebKit / iOS Safari still look for these attributes.
      {...{
        'webkit-playsinline': 'true',
        'x5-playsinline': 'true',
      }}
    >
      <source src={src} type={type} />
    </video>
  )
})
