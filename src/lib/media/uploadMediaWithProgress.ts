import { baseUrl } from '@/redux/api/api'
import { store } from '@/redux/store'

export const MAX_MEDIA_UPLOAD_MB = 50
export const MAX_MEDIA_UPLOAD_BYTES = MAX_MEDIA_UPLOAD_MB * 1024 * 1024

export type MediaUploadWithProgressResult = {
  url: string
  publicId: string
  attachment?: unknown
}

export type UploadMediaWithProgressOptions = {
  file: File
  profileId?: string | null
  attachmentType?: string
  /** Override the default 50MB cap (e.g. field-specific 15MB / 30MB limits). */
  maxBytes?: number
  onProgress?: (percent: number) => void
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

export function mediaFileTooLargeMessage(maxBytes: number) {
  const mb = Math.max(1, Math.round(maxBytes / (1024 * 1024)))
  return `File is too large. Maximum size is ${mb}MB.`
}

export function assertMediaFileSize(file: File, maxBytes = MAX_MEDIA_UPLOAD_BYTES) {
  if (file.size > maxBytes) {
    throw new MediaUploadError(mediaFileTooLargeMessage(maxBytes))
  }
}

function isEntityTooLargeResponse(status: number, bodyText: string) {
  if (status === 413) return true
  return /entity too large|request entity too large|payload too large/i.test(bodyText)
}

type Envelope = {
  success?: boolean
  message?: string
  data?: MediaUploadWithProgressResult
}

export function uploadMediaWithProgress(
  options: UploadMediaWithProgressOptions
): Promise<MediaUploadWithProgressResult> {
  const { file, profileId, attachmentType, maxBytes = MAX_MEDIA_UPLOAD_BYTES, onProgress, signal } = options

  assertMediaFileSize(file, maxBytes)

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    const form = new FormData()
    form.append('file', file)
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
        reject(new MediaUploadError(mediaFileTooLargeMessage(maxBytes), 413))
        return
      }

      const message = parsed?.message || `Upload failed (${xhr.status || 'network error'})`
      reject(new MediaUploadError(message, xhr.status))
    }

    xhr.onerror = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new MediaUploadError('Upload failed'))
    }

    xhr.onabort = () => {
      signal?.removeEventListener('abort', onAbort)
      reject(new MediaUploadError('Upload cancelled'))
    }

    onProgress?.(0)
    xhr.send(form)
  })
}
