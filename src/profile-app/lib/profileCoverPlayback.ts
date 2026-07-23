/** Persists cover video position across React remounts (per source URL). */
type PlaybackSnapshot = {
  currentTime: number
  wasPlaying: boolean
}

const snapshots = new Map<string, PlaybackSnapshot>()

export function saveCoverPlayback(src: string, video: HTMLVideoElement) {
  if (!src) return
  snapshots.set(src, {
    currentTime: video.currentTime,
    wasPlaying: !video.paused && !video.ended,
  })
}

export function restoreCoverPlayback(src: string, video: HTMLVideoElement) {
  const snap = snapshots.get(src)
  if (!snap) return false
  const apply = () => {
    if (snap.currentTime > 0 && Number.isFinite(video.duration) && video.duration > 0) {
      video.currentTime = Math.min(snap.currentTime, video.duration - 0.05)
    } else if (snap.currentTime > 0) {
      video.currentTime = snap.currentTime
    }
    if (snap.wasPlaying) void video.play().catch(() => undefined)
  }
  if (video.readyState >= 1) {
    apply()
    return true
  }
  video.addEventListener('loadedmetadata', apply, { once: true })
  return true
}
