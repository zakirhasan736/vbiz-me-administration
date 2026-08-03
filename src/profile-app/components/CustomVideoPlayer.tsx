import { isVideoUrl } from '@/lib/mediaUrl'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { MouseEvent, useEffect, useRef, useState } from 'react'

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
}

function ProfileMediaImage({ src, className = '', imageAlt = 'Profile' }: CustomVideoPlayerProps) {
  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        width={800}
        height={800}
        src={src}
        alt={imageAlt}
        className="h-full w-full object-cover opacity-90 transition-all duration-700 group-hover/profile:scale-105 group-hover/profile:opacity-100"
      />
    </div>
  )
}

const controlBtnClass =
  'flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-black/50 text-white shadow-lg backdrop-blur-md transition-colors hover:bg-black/70 hover:text-[#facc15]'

function ProfileVideoPlayer({
  src,
  className = '',
  controlsMode = 'hover',
  showSeekBar = true,
}: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  const isOwnerLayout = controlsMode === 'owner'
  const showPlayButton = isOwnerLayout ? isHovering || !isPlaying : isHovering

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

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    video.muted = isMuted
  }, [isMuted])

  const togglePlay = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const video = videoRef.current
    if (!video) return
    if (video.paused) void video.play().catch(() => undefined)
    else video.pause()
  }

  const toggleMute = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMuted((prev) => !prev)
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

  return (
    <div
      className={`group/profile relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={handleVideoAreaClick}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="metadata"
        className="h-full w-full cursor-pointer object-cover opacity-90 transition-all duration-700 group-hover/profile:scale-105 group-hover/profile:opacity-100"
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
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            className={`pointer-events-auto absolute right-3 bottom-3 z-20 ${controlBtnClass}`}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </>
      ) : (
        <div
          className={`absolute right-3 bottom-3 left-3 z-20 flex flex-col gap-2 rounded-xl border border-white/20 bg-black/45 p-2.5 shadow-xl backdrop-blur-md transition-all duration-300 ${
            isHovering ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-2 opacity-0'
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
              aria-label={isMuted ? 'Unmute video' : 'Mute video'}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-[#facc15]"
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
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
