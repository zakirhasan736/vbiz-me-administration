import { isOptimizableImageFile, optimizeImageFile } from '@/lib/media/optimizeImageFile'
import { MAX_VIDEO_SOURCE_BYTES, isVideoFile, optimizeVideoFile } from '@/lib/media/optimizeVideoFile'
import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

export { isVideoFile }

export function mediaNeedsClientOptimize(file: File) {
  return isVideoFile(file) || isOptimizableImageFile(file)
}

export type MediaUploadWithProgressResult = {
  url: string
  publicId: string
  attachment?: unknown
}

export type UploadMediaWithProgressOptions = {
  file: File
  profileId?: string | null
  attachmentType?: string
  onProgress?: (percent: number) => void
  onStatus?: (status: 'preparing' | 'uploading') => void
  signal?: AbortSignal
}

const OPTIMIZE_PROGRESS_WEIGHT = 85

export class MediaUploadError extends Error {
  status?: number

  constructor(message: string, status?: number) {
    super(message)
    this.name = 'MediaUploadError'
    this.status = status
  }
}

/** @deprecated Builder uploads have no client-side size gate. */
export function assertMediaFileSize(_file: File, _maxBytes?: number) {
  // no-op — uploads are not capped in the browser
}

export function isEntityTooLargeResponse(status: number, bodyText: string) {
  if (status === 413) return true
  return /entity too large|request entity too large|payload too large/i.test(bodyText)
}

/** Nginx often returns 413 HTML without CORS, so XHR fires onerror with status 0. */
export function mediaUploadTransportErrorMessage() {
  return 'Upload failed. Check your connection and try again.'
}

export function mediaUploadRejectedTooLargeMessage() {
  return 'Upload was rejected by the server or network proxy. If this persists, ask support to raise the upload limit.'
}

export function mediaUploadInterruptedMessage() {
  return 'Upload was interrupted before the file finished sending. Please try again.'
}

export function isMultipartTruncatedMessage(message: string) {
  return /unexpected end of form|unexpected end of request|multipart.*truncated|premature close/i.test(message || '')
}

const MIME_FROM_EXT: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  avif: 'image/avif',
  heic: 'image/heic',
  heif: 'image/heif',
  bmp: 'image/bmp',
  svg: 'image/svg+xml',
  mp4: 'video/mp4',
  mov: 'video/quicktime',
  m4v: 'video/x-m4v',
  webm: 'video/webm',
  ogv: 'video/ogg',
  ogg: 'video/ogg',
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  m4a: 'audio/mp4',
}

/** Busboy/multer 2 rejects parts whose Content-Type includes codec params (e.g. video/mp4;codecs=...). */
export function sanitizeUploadMimeType(file: Pick<File, 'type' | 'name'>) {
  const raw = (file.type || '').split(';')[0].trim().toLowerCase()
  if (raw && raw !== 'application/octet-stream') return raw
  const ext = file.name.split('.').pop()?.toLowerCase() || ''
  return MIME_FROM_EXT[ext] || raw || 'application/octet-stream'
}

export function sanitizeUploadFileName(name: string) {
  const trimmed = (name || 'upload').trim() || 'upload'
  return trimmed.replace(/[^\w.\- ()[\]]+/g, '_').slice(0, 180)
}

/** Rebuild the File so FormData always has a filename and a clean MIME type. */
export function toMultipartFile(file: File): File {
  const type = sanitizeUploadMimeType(file)
  const name = sanitizeUploadFileName(file.name)
  if (file.size > 0 && file.type === type && file.name === name) return file
  return new File([file], name, { type, lastModified: file.lastModified })
}

type Envelope = {
  success?: boolean
  message?: string
  data?: MediaUploadWithProgressResult
}

export async function uploadMediaWithProgress(
  options: UploadMediaWithProgressOptions
): Promise<MediaUploadWithProgressResult> {
  const { profileId, attachmentType, onProgress, onStatus, signal } = options
  let uploadFile = options.file

  if (signal?.aborted) throw new MediaUploadError('Upload cancelled')

  if (isVideoFile(uploadFile)) {
    onStatus?.('preparing')
    onProgress?.(0)
    if (uploadFile.size <= MAX_VIDEO_SOURCE_BYTES) {
      try {
        uploadFile = await optimizeVideoFile(uploadFile, {
          signal,
          onProgress: (pct) => onProgress?.(Math.round((pct / 100) * OPTIMIZE_PROGRESS_WEIGHT)),
        })
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
          throw new MediaUploadError('Upload cancelled')
        }
        // Timeout or recorder failure — upload the original file.
      }
    }
  } else if (isOptimizableImageFile(uploadFile)) {
    onStatus?.('preparing')
    try {
      uploadFile = await optimizeImageFile(uploadFile, signal)
    } catch (error) {
      if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
        throw new MediaUploadError('Upload cancelled')
      }
    }
  }

  if (signal?.aborted) throw new MediaUploadError('Upload cancelled')
  if (!uploadFile.size) throw new MediaUploadError('That file is empty. Choose another image or video.')

  uploadFile = toMultipartFile(uploadFile)

  const hadPrepareStage = isVideoFile(options.file) || isOptimizableImageFile(options.file)
  if (hadPrepareStage) onProgress?.(OPTIMIZE_PROGRESS_WEIGHT)

  onStatus?.('uploading')

  const sendOnce = () =>
    new Promise<MediaUploadWithProgressResult>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      const form = new FormData()
      form.append('file', uploadFile, uploadFile.name)
      if (profileId) {
        form.append('profileId', profileId)
        form.append('attachableType', 'Profile')
        form.append('attachableId', profileId)
      }
      if (attachmentType) form.append('attachmentType', attachmentType)

      const onAbort = () => {
        xhr.abort()
        reject(new MediaUploadError('Upload cancelled'))
      }
      if (signal) {
        if (signal.aborted) {
          onAbort()
          return
        }
        signal.addEventListener('abort', onAbort, { once: true })
      }

      xhr.open('POST', `${baseUrl.replace(/\/$/, '')}/media/upload`)
      xhr.withCredentials = true

      const token = store.getState().user.token
      if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`)

      xhr.upload.onprogress = (event) => {
        if (!event.lengthComputable || !onProgress) return
        const uploadPct = Math.min(100, Math.round((event.loaded / event.total) * 100))
        const combined =
          isVideoFile(options.file) || isOptimizableImageFile(options.file)
            ? OPTIMIZE_PROGRESS_WEIGHT + Math.round(((100 - OPTIMIZE_PROGRESS_WEIGHT) * uploadPct) / 100)
            : uploadPct
        onProgress(Math.min(100, combined))
      }

      xhr.onload = () => {
        signal?.removeEventListener('abort', onAbort)
        const raw = xhr.responseText || ''
        let parsed: Envelope | null = null
        try {
          parsed = JSON.parse(raw) as Envelope
        } catch {
          parsed = null
        }

        if (xhr.status >= 200 && xhr.status < 300 && parsed?.data?.url) {
          onProgress?.(100)
          resolve({
            url: parsed.data.url,
            publicId: parsed.data.publicId,
            attachment: parsed.data.attachment,
          })
          return
        }

        if (isEntityTooLargeResponse(xhr.status, raw) || isEntityTooLargeResponse(xhr.status, parsed?.message || '')) {
          reject(new MediaUploadError(mediaUploadRejectedTooLargeMessage(), 413))
          return
        }

        const message = parsed?.message || `Upload failed (${xhr.status || 'network error'})`
        reject(
          new MediaUploadError(
            isMultipartTruncatedMessage(message) ? mediaUploadInterruptedMessage() : message,
            xhr.status
          )
        )
      }

      xhr.onerror = () => {
        signal?.removeEventListener('abort', onAbort)
        reject(new MediaUploadError(mediaUploadTransportErrorMessage()))
      }

      xhr.onabort = () => {
        signal?.removeEventListener('abort', onAbort)
        reject(new MediaUploadError('Upload cancelled'))
      }

      xhr.send(form)
    })

  try {
    return await sendOnce()
  } catch (error) {
    if (signal?.aborted) throw error
    const message = error instanceof Error ? error.message : ''
    if (!isMultipartTruncatedMessage(message) && message !== mediaUploadInterruptedMessage()) throw error
    return sendOnce()
  }
}
