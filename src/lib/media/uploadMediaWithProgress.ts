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
    if (uploadFile.size <= MAX_VIDEO_SOURCE_BYTES) {
      try {
        uploadFile = await optimizeVideoFile(uploadFile, signal)
      } catch (error) {
        if (signal?.aborted || (error instanceof DOMException && error.name === 'AbortError')) {
          throw new MediaUploadError('Upload cancelled')
        }
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

  onStatus?.('uploading')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', uploadFile)
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
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100))
      onProgress(percent)
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
      reject(new MediaUploadError(message, xhr.status))
    }

    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new MediaUploadError(mediaUploadTransportErrorMessage()))
    }

    xhr.onabort = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new MediaUploadError('Upload cancelled'))
    }

    onProgress?.(0)
    xhr.send(form)
  })
}
