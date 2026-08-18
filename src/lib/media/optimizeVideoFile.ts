export const MAX_VIDEO_SOURCE_MB = 200
export const MAX_VIDEO_SOURCE_BYTES = MAX_VIDEO_SOURCE_MB * 1024 * 1024

const MAX_VIDEO_WIDTH = 1280
const MAX_VIDEO_HEIGHT = 720
const VIDEO_FPS = 30
const VIDEO_BITRATE = 1_500_000
const AUDIO_BITRATE = 96_000
const MIN_VIDEO_COMPRESSION_BYTES = 1 * 1024 * 1024

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

const playForCapture = async (video: HTMLVideoElement) => {
  try {
    await video.play()
  } catch {
    video.muted = true
    await video.play()
  }
}

const compressVideo = async (file: File, signal?: AbortSignal): Promise<File> => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file

  const mimeType = supportedMimeType()
  if (!mimeType || !HTMLCanvasElement.prototype.captureStream) return file

  const objectUrl = URL.createObjectURL(file)
  const video = document.createElement('video')
  video.preload = 'auto'
  video.playsInline = true
  video.src = objectUrl

  try {
    await waitForMetadata(video, signal)
    if (!video.videoWidth || !video.videoHeight) return file

    await playForCapture(video)
    if (signal?.aborted) throw new DOMException('Upload cancelled', 'AbortError')

    const sourceStream = (video as VideoWithCaptureStream).captureStream?.()
    if (!sourceStream) return file

    const dimensions = scaledDimensions(video.videoWidth, video.videoHeight)
    const canvas = document.createElement('canvas')
    canvas.width = dimensions.width
    canvas.height = dimensions.height
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

    const compressedBlob = await new Promise<Blob>((resolve, reject) => {
      let animationFrame = 0
      let settled = false

      const stopTracks = () => {
        cancelAnimationFrame(animationFrame)
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
        resolve(new Blob(chunks, { type: mimeType }))
      }
      const drawFrame = () => {
        if (settled) return
        if (!video.ended) {
          context.drawImage(video, 0, 0, dimensions.width, dimensions.height)
          animationFrame = requestAnimationFrame(drawFrame)
        }
      }
      const onAbort = () => {
        if (recorder.state !== 'inactive') recorder.stop()
        fail(new DOMException('Upload cancelled', 'AbortError'))
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
    video.removeAttribute('src')
    video.load()
    URL.revokeObjectURL(objectUrl)
  }
}

export const isVideoFile = (file: File) =>
  file.type.toLowerCase().startsWith('video/') || /\.(mp4|webm|mov|m4v|ogg|ogv)$/i.test(file.name)

export const optimizeVideoFile = async (file: File, signal?: AbortSignal): Promise<File> => {
  if (!isVideoFile(file) || file.size < MIN_VIDEO_COMPRESSION_BYTES) return file
  return compressVideo(file, signal)
}
