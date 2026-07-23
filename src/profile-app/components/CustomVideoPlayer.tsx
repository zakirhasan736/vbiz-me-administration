import { isVideoUrl } from '@/lib/mediaUrl'
import { Pause, Play, Volume2, VolumeX } from 'lucide-react'
import Image from 'next/image'
import { MouseEvent, useEffect, useRef, useState } from 'react'

interface CustomVideoPlayerProps {
  src: string
  className?: string
  imageAlt?: string
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

function ProfileVideoPlayer({ src, className = '' }: CustomVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(true)
  const [progress, setProgress] = useState(0)
  const [isMuted, setIsMuted] = useState(true)
  const [isHovering, setIsHovering] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      if (video.duration) {
        setProgress((video.currentTime / video.duration) * 100)
      }
    }

    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('timeupdate', updateProgress)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('timeupdate', updateProgress)
      video.removeEventListener('ended', handleEnded)
    }
  }, [src])

  const togglePlay = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const toggleMute = (e: MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !isMuted
      setIsMuted(!isMuted)
    }
  }

  const handleSeek = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100))

    if (videoRef.current) {
      const newTime = (percentage / 100) * (videoRef.current.duration || 0)
      if (isFinite(newTime)) {
        videoRef.current.currentTime = newTime
      }
      setProgress(percentage)
    }
  }

  return (
    <div
      className={`group/profile relative overflow-hidden ${className}`}
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
      onClick={togglePlay}
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted={isMuted}
        playsInline
        className="h-full w-full cursor-pointer object-cover opacity-90 transition-all duration-700 group-hover/profile:scale-105 group-hover/profile:opacity-100"
      />

      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
      <div className="pointer-events-none absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.8)]" />

      <div
        className={`absolute right-3 bottom-3 left-3 z-20 flex flex-col gap-2 rounded-xl border border-white/20 bg-white/10 p-2.5 shadow-xl backdrop-blur-md transition-all duration-300 ${isHovering ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="group/bar relative h-1.5 w-full cursor-pointer overflow-hidden rounded-full bg-white/20"
          onClick={handleSeek}
        >
          <div
            className="absolute top-0 left-0 h-full bg-[#facc15] transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="pointer-events-auto flex items-center justify-between">
          <button
            type="button"
            onClick={togglePlay}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-[#facc15]"
          >
            {isPlaying ? (
              <Pause size={14} fill="currentColor" />
            ) : (
              <Play size={14} fill="currentColor" className="ml-0.5" />
            )}
          </button>

          <button
            type="button"
            onClick={toggleMute}
            className="flex h-6 w-6 items-center justify-center rounded-full text-white transition-colors hover:bg-white/10 hover:text-[#facc15]"
          >
            {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
        </div>
      </div>
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
