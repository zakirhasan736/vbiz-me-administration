import { profileMediaFitStyle, type ProfileMediaFrame } from '@/lib/media/profileMediaFrame'
import { isVideoUrl } from '@/lib/mediaUrl'
import { HOME_MEDIA_SOUND_EVENT, type HomeMediaSoundDetail } from '@/profile-app/lib/homeMediaSound'
import {
  getOwnerVideoMuteOverride,
  setOwnerVideoMuteOverride,
  subscribeOwnerVideoMute,
} from '@/profile-app/lib/profileOwnerVideoMute'
import { useProfileIntroContextOptional } from '@/profile-app/providers/ProfileIntroProvider'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { MouseEvent, useEffect, useRef, useState, useSyncExternalStore } from 'react'

interface CustomVideoPlayerProps {
  src: string
  className?: string
  imageAlt?: string
  /**
   * `owner` — mute always visible; play/pause on hover (home owner videos).
   * `hover` — full control bar on hover.
   */
  controlsMode?: 'hover' | 'owner'
  showSeekBar?: boolean
  /** When set, crop uses this position and zoom instead of the default top crop. */
  mediaFrame?: ProfileMediaFrame | null
}

function ProfileMediaImage({ src, className = '', imageAlt = 'Profile', mediaFrame }: CustomVideoPlayerProps) {
  const fit = mediaFrame ? profileMediaFitStyle(mediaFrame) : null
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        width={800}
        height={800}
        src={src}
        alt={imageAlt}
        className={
          fit
            ? 'h-full w-full object-cover opacity-90'
            : 'h-full w-full object-cover object-top opacity-90 transition-all duration-700 group-hover/profile:scale-105 group-hover/profile:opacity-100'
        }
        style={fit ?? { objectPosition: 'top' }}
      />
    </div>
  )
}

const controlBtnClass =
  'flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/70 hover:text-[#facc15]'

function useCoarsePointer() {
  return useSyncExternalStore(
    (onStoreChange) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return () => {}
      const mq = window.matchMedia('(pointer: coarse)')
      mq.addEventListener('change', onStoreChange)
      return () => mq.removeEventListener('change', onStoreChange)
    },
    () =>
      typeof window !== 'undefined' && (window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 0),
    () => false
  )
}

function ProfileVideoPlayer({
  src,
  className = '',
  controlsMode = 'hover',
  showSeekBar = true,
  mediaFrame,
}: CustomVideoPlayerProps) {
  const rootRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const onScreenRef = useRef(false)
  const homeReadyRef = useRef(true)
  const [isPlaying, setIsPlaying] = useState(false)
  const [progress, setProgress] = useState(0)
  const [ownerOnScreen, setOwnerOnScreen] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  const intro = useProfileIntroContextOptional()
  const introSoundUnlocked = Boolean(intro?.homeMediaSoundUnlocked)
  // Wait until intro ends/skips (or no intro) before home profile video starts.
  const homeReady = intro ? intro.introAllowed : true
  const isOwnerLayout = controlsMode === 'owner'
  // Shared across phone + desktop mounts so mute button mutes every copy (stops echo).
  const userMuteOverride = useSyncExternalStore(subscribeOwnerVideoMute, getOwnerVideoMuteOverride, () => null)
  const wantMuted = userMuteOverride ?? (isOwnerLayout ? !introSoundUnlocked : true)
  const onScreen = isOwnerLayout ? ownerOnScreen : true
  /** Owner profile may play only on the visible home tile after intro is done. */
  const canStartPlayback = !isOwnerLayout || (homeReady && onScreen)
  // Hidden twin / pre-intro: never output audio.
  const isMuted = wantMuted || (isOwnerLayout && !canStartPlayback)

  const coarsePointer = useCoarsePointer()
  const fit = mediaFrame ? profileMediaFitStyle(mediaFrame) : null

  const showPlayButton = isOwnerLayout ? isHovering || !isPlaying || coarsePointer : isHovering || coarsePointer
  const showHoverBar = isHovering || coarsePointer

  useEffect(() => {
    onScreenRef.current = onScreen
  }, [onScreen])

  useEffect(() => {
    homeReadyRef.current = homeReady
  }, [homeReady])

  useEffect(() => {
    if (!isOwnerLayout) return
    const root = rootRef.current
    if (!root || typeof IntersectionObserver === 'undefined') return

    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = Boolean(entry?.isIntersecting && (entry.intersectionRatio ?? 0) > 0.05)
        setOwnerOnScreen(visible)
      },
      { threshold: [0, 0.05, 0.25] }
    )
    observer.observe(root)
    return () => observer.disconnect()
  }, [isOwnerLayout, src])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100)
      }
    }

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [src])

  // Start / pause / mute according to intro gate + visibility + user mute.
  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (!canStartPlayback) {
      video.muted = true
      video.defaultMuted = true
      video.setAttribute('muted', '')
      if (!video.paused) video.pause()
      // Rewind so home starts cleanly when intro finishes.
      if (isOwnerLayout && !homeReady) {
        try {
          video.currentTime = 0
        } catch {
          /* ignore */
        }
      }
      return
    }

    video.muted = wantMuted
    if (wantMuted) {
      video.setAttribute('muted', '')
      video.defaultMuted = true
    } else {
      video.removeAttribute('muted')
      video.defaultMuted = false
      if (video.volume === 0) video.volume = 1
    }
    if (video.paused) void video.play().catch(() => undefined)
  }, [canStartPlayback, homeReady, isOwnerLayout, wantMuted])

  // Intro unmute only applies after home is ready — preference is kept in context until then.
  useEffect(() => {
    if (!isOwnerLayout) return

    const onSoundPreference = (event: Event) => {
      if (getOwnerVideoMuteOverride() != null) return
      // During intro: remember preference via context only; do not start profile audio yet.
      if (!homeReadyRef.current || !onScreenRef.current) return
      const detail = (event as CustomEvent<HomeMediaSoundDetail>).detail
      const unlocked = Boolean(detail?.unlocked)
      const video = videoRef.current
      if (!video) return
      if (!unlocked) {
        video.muted = true
        video.defaultMuted = true
        video.setAttribute('muted', '')
        return
      }
      video.muted = false
      video.defaultMuted = false
      video.removeAttribute('muted')
      if (video.volume === 0) video.volume = 1
      void video.play().catch(() => undefined)
    }

    window.addEventListener(HOME_MEDIA_SOUND_EVENT, onSoundPreference)
    return () => window.removeEventListener(HOME_MEDIA_SOUND_EVENT, onSoundPreference)
  }, [isOwnerLayout])

  const togglePlay = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (isOwnerLayout && !homeReady) return
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
  }

  const toggleMute = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return

    if (wantMuted) {
      setOwnerVideoMuteOverride(false)
      if (canStartPlayback) {
        video.muted = false
        video.defaultMuted = false
        video.removeAttribute('muted')
        if (video.volume === 0) video.volume = 1
        if (video.paused) void video.play().catch(() => undefined)
      }
      return
    }

    setOwnerVideoMuteOverride(true)
    video.muted = true
    video.defaultMuted = true
    video.setAttribute('muted', '')
  }

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

    const video = videoRef.current
    if (!video) return

    const newTime = (percentage / 100) * (video.duration || 0)
    if (isFinite(newTime)) {
      video.currentTime = newTime
    }
    setProgress(percentage)
  }

  const handleVideoAreaClick = () => {
    if (isOwnerLayout) return
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
  }

  // Button UI follows user intent (not off-screen forced mute).
  const muteButtonMuted = wantMuted

  return (
    <div
      ref={rootRef}
      className={`group/profile relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleVideoAreaClick}
    >
      <video
        ref={videoRef}
        src={src}
        // Owner home video is started by effect after intro ends — avoid racing the intro.
        autoPlay={!isOwnerLayout}
        loop
        muted={isMuted}
        playsInline
        preload={isOwnerLayout ? (homeReady ? 'auto' : 'metadata') : 'metadata'}
        className={
          fit
            ? 'h-full w-full cursor-pointer object-cover opacity-90'
            : 'h-full w-full cursor-pointer object-cover object-top opacity-90 transition-all duration-700 group-hover/profile:scale-105 group-hover/profile:opacity-100'
        }
        style={fit ?? undefined}
        {...{
          'webkit-playsinline': 'true',
          'x5-playsinline': 'true',
        }}
      />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />

      {isOwnerLayout ? (
        <>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? 'Pause video' : 'Play video'}
            className={`pointer-events-auto absolute bottom-3 left-3 z-20 ${controlBtnClass} transition-all duration-300 ${
              showPlayButton ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-1 opacity-0'
            }`}
          >
            {isPlaying ? (
              <Pause size={16} fill="currentColor" />
            ) : (
              <Play size={16} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={muteButtonMuted ? 'Unmute video' : 'Mute video'}
            className={`pointer-events-auto absolute right-3 bottom-3 z-20 ${controlBtnClass}`}
          >
            {muteButtonMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </>
      ) : (
        <div
          className={`absolute right-3 bottom-3 left-3 z-20 flex flex-col gap-2 rounded-xl border border-white/20 bg-black/45 p-2.5 shadow-xl backdrop-blur-md transition-all duration-300 ${
            showHoverBar ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {showSeekBar ? (
            <div
              className="group/bar relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/20"
              onClick={handleSeek}
            >
              <div
                className="absolute top-0 left-0 h-full bg-[#facc15] transition-all duration-100 ease-linear"
                style={{ width: `${progress}%` }}
              />
            </div>
          ) : null}

          <div className="pointer-events-auto flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={togglePlay}
              aria-label={isPlaying ? 'Pause video' : 'Play video'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-[#facc15]"
            >
              {isPlaying ? (
                <Pause size={16} fill="currentColor" />
              ) : (
                <Play size={16} fill="currentColor" className="ml-0.5" />
              )}
            </button>

            <button
              type="button"
              onClick={toggleMute}
              aria-label={muteButtonMuted ? 'Unmute video' : 'Mute video'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-[#facc15]"
            >
              {muteButtonMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Profile tile: image when src is a still, video player when src is video. */
export const CustomVideoPlayer = (props: CustomVideoPlayerProps) => {
  if (!isVideoUrl(props.src)) {
    return <ProfileMediaImage {...props} />
  }
  return <ProfileVideoPlayer {...props} />
}
