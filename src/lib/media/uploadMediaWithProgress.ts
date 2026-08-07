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

export function assertMediaFileSize(file: File, maxBytes = MAX_MEDIA_UPLOAD_BYTES) {
  if (file.size > maxBytes) {
    throw new MediaUploadError(`File size exceeds ${MAX_MEDIA_UPLOAD_MB}MB`)
  }
}

type Envelope = {
  success?: boolean
  message?: string
  data?: MediaUploadWithProgressResult
}

export function uploadMediaWithProgress(
  options: UploadMediaWithProgressOptions
): Promise<MediaUploadWithProgressResult> {
  const { file, profileId, attachmentType, onProgress, signal } = options

  assertMediaFileSize(file)

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
      let parsed: Envelope | null = null
      try {
        parsed = JSON.parse(xhr.responseText) as Envelope
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

      const message =
        parsed?.message ||
        (xhr.status === 413 ? `File size exceeds ${MAX_MEDIA_UPLOAD_MB}MB` : null) ||
        `Upload failed (${xhr.status || 'network error'})`
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
