export const MAX_VIDEO_SOURCE_MB = 200
export const MAX_VIDEO_SOURCE_BYTES = MAX_VIDEO_SOURCE_MB * 1024 * 1024

/** Skip re-encode above this size — upload original for speed. */
export const SKIP_VIDEO_OPTIMIZE_BYTES = 40 * 1024 * 1024

/** Skip re-encode when longer than this (seconds). */
export const MAX_VIDEO_OPTIMIZE_DURATION_SEC = 240

const MAX_VIDEO_WIDTH = 1280
const MAX_VIDEO_HEIGHT = 720
const VIDEO_FPS = 30
const VIDEO_BITRATE = 1_500_000
const AUDIO_BITRATE = 96_000
const MIN_VIDEO_COMPRESSION_BYTES = 1 * 1024 * 1024

export type OptimizeVideoOptions = {
  signal?: AbortSignal
  onProgress?: (percent: number) => void
}

type VideoWithCaptureStream = HTMLVideoElement & {
  captureStream?: () => MediaStream
}

const supportedMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return ''

  return (
    ['video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm', 'video/mp4'].find((mimeType) =>
      MediaRecorder.isTypeSupported(mimeType)
    ) || ''
  )
}

const scaledDimensions = (width: number, height: number) => {
  const scale = Math.min(1, MAX_VIDEO_WIDTH / width, MAX_VIDEO_HEIGHT / height)
  return {
    width: Math.max(2, Math.floor((width * scale) / 2) * 2),
    height: Math.max(2, Math.floor((height * scale) / 2) * 2),
  }
}

const waitForMetadata = (video: HTMLVideoElement, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const onLoadedMetadata = () => {
      cleanup()
      resolve()
    }
    const onError = () => {
      cleanup()
      reject(new Error('Video could not be read'))
    }
    const onAbort = () => {
      cleanup()
      reject(new DOMException('Upload cancelled', 'AbortError'))
    }
    const cleanup = () => {
      video.removeEventListener('loadedmetadata', onLoadedMetadata)
      video.removeEventListener('error', onError)
      signal?.removeEventListener('abort', onAbort)
    }

    video.addEventListener('loadedmetadata', onLoadedMetadata, { once: true })
    video.addEventListener('error', onError, { once: true })
    signal?.addEventListener('abort', onAbort, { once: true })

    if (video.readyState >= 1) onLoadedMetadata()
  })

/** Faster playback during capture — re-encode finishes in wall-clock time / rate. */
export function pickVideoOptimizePlaybackRate(durationSec: number): number {
  if (!Number.isFinite(durationSec) || durationSec <= 0) return 8
  if (durationSec > 180) return 16
  if (durationSec > 60) return 12
  if (durationSec > 30) return 8
  return 4
}

export function shouldSkipVideoOptimize(file: File, durationSec?: number): boolean {
  if (!isVideoFile(file)) return true
  if (file.size < MIN_VIDEO_COMPRESSION_BYTES) return true
  if (file.size > SKIP_VIDEO_OPTIMIZE_BYTES) return true
  if (durationSec != null && durationSec > MAX_VIDEO_OPTIMIZE_DURATION_SEC) return true
  return false
}

const compressVideo = async (file: File, options?: OptimizeVideoOptions): Promise<File> => {
  const signal = options?.signal
  const onProgress = options?.onProgress

  if (typeof window === 'undefined' || typeof document === 'undefined') return file

  const mimeType = supportedMimeType()
  if (!mimeType || !HTMLCanvasElement.prototype.captureStream) return file

  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.playsInline = true
  video.muted = true
  video.defaultMuted = true
  video.src = objectUrl

  try {
    await waitForMetadata(video, signal)
    if (!video.videoWidth || !video.videoHeight) return file

    const durationSec = Number.isFinite(video.duration) ? video.duration : 0
    if (shouldSkipVideoOptimize(file, durationSec)) return file

    const { width: targetWidth, height: targetHeight } = scaledDimensions(video.videoWidth, video.videoHeight)
    const alreadySmall =
      targetWidth === video.videoWidth &&
      targetHeight === video.videoHeight &&
      file.size <= 8 * 1024 * 1024 &&
      durationSec > 0 &&
      durationSec <= 90
    if (alreadySmall) return file

    const playbackRate = pickVideoOptimizePlaybackRate(durationSec)
    video.playbackRate = playbackRate

    try {
      await video.play()
    } catch {
      video.muted = true
      await video.play()
    }

    if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')

    const sourceStream = (video as VideoWithCaptureStream).captureStream?.()
    if (!sourceStream) return file

    const canvas = document.createElement('canvas')
    canvas.width = targetWidth
    canvas.height = targetHeight
    const context = canvas.getContext('2d')
    if (!context) return file

    const outputStream = canvas.captureStream(VIDEO_FPS)
    sourceStream.getAudioTracks().forEach((track) => outputStream.addTrack(track))

    const recorder = new MediaRecorder(outputStream, {
      mimeType,
      videoBitsPerSecond: VIDEO_BITRATE,
      audioBitsPerSecond: AUDIO_BITRATE,
    })
    const chunks: Blob[] = []

    const reportProgress = () => {
      if (!onProgress || !durationSec) return
      const pct = Math.min(99, Math.round((video.currentTime / durationSec) * 100))
      onProgress(pct)
    }

    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      let animationFrame = 0
      let settled = false
      let timeoutId = 0

      const expectedMs =
        durationSec > 0 ? Math.min(180_000, Math.max(20_000, (durationSec / playbackRate) * 1000 + 15_000)) : 90_000

      const stopTracks = () => {
        cancelAnimationFrame(animationFrame)
        window.clearTimeout(timeoutId)
        sourceStream.getTracks().forEach((track) => track.stop())
        outputStream.getTracks().forEach((track) => track.stop())
      }
      const fail = (error: unknown) => {
        if (settled) return
        settled = true
        stopTracks()
        reject(error)
      }
      const finish = () => {
        if (settled) return
        settled = true
        stopTracks()
        onProgress?.(100)
        resolve(new Blob(chunks, { type: mimeType }))
      }
      const drawFrame = () => {
        if (settled) return
        reportProgress()
        if (!video.ended) {
          context.drawImage(video, 0, 0, targetWidth, targetHeight)
          animationFrame = requestAnimationFrame(drawFrame)
        }
      }
      const onAbort = () => {
        if (recorder.state !== 'inactive') recorder.stop()
        fail(new DOMException('Upload cancelled', 'AbortError'))
      }
      const onTimeout = () => {
        if (recorder.state !== 'inactive') recorder.stop()
        fail(new Error('Video optimization timed out'))
      }

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunks.push(event.data)
      }
      recorder.onerror = () => fail(new Error('Video optimization failed'))
      recorder.onstop = finish
      video.addEventListener(
        'ended',
        () => {
          if (recorder.state !== 'inactive') recorder.stop()
        },
        { once: true }
      )
      signal?.addEventListener('abort', onAbort, { once: true })
      timeoutId = window.setTimeout(onTimeout, expectedMs)

      try {
        recorder.start(1000)
        drawFrame()
      } catch (error) {
        fail(error)
      }
    })

    if (compressedBlob.size >= file.size * 0.95) return file

    const extension = mimeType.includes('mp4') ? 'mp4' : 'webm'
    const baseName = file.name.replace(/\.[^/.]+$/, '') || 'video'
    return new File([compressedBlob], `${baseName}.${extension}`, {
      type: mimeType,
      lastModified: file.lastModified,
    })
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error
    return file
  } finally {
    video.pause()
    video.playbackRate = 1
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(objectUrl)
  }
}

export const isVideoFile = (file: File) =>
  file.type.toLowerCase().startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name)

export const optimizeVideoFile = async (file: File, options?: OptimizeVideoOptions): Promise<File> => {
  if (shouldSkipVideoOptimize(file)) return file
  return compressVideo(file, options)
}
