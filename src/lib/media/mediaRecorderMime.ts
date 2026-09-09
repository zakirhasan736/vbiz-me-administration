export type RecordedMediaKind = 'audio' | 'video'

const AUDIO_MIME_CANDIDATES = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'] as const
const VIDEO_MIME_CANDIDATES = [
  'video/webm;codecs=vp9,opus',
  'video/webm;codecs=vp8,opus',
  'video/webm',
  'video/mp4',
] as const

export function pickAudioRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  return AUDIO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

export function pickVideoRecorderMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return ''
  return VIDEO_MIME_CANDIDATES.find((type) => MediaRecorder.isTypeSupported(type)) || ''
}

function extensionForMime(mimeType: string, kind: RecordedMediaKind): string {
  const lower = mimeType.toLowerCase()
  if (kind === 'audio') {
    if (lower.includes('mp4') || lower.includes('m4a') || lower.includes('aac')) return 'm4a'
    if (lower.includes('ogg')) return 'ogg'
    return 'webm'
  }
  if (lower.includes('mp4')) return 'mp4'
  return 'webm'
}

export function blobToRecordedFile(blob: Blob, kind: RecordedMediaKind, prefix = 'wish'): File {
  const mimeType = blob.type || (kind === 'audio' ? 'audio/webm' : 'video/webm')
  const ext = extensionForMime(mimeType, kind)
  return new File([blob], `${prefix}-${kind}-${Date.now()}.${ext}`, { type: mimeType })
}

export function formatRecordingElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export const AUDIO_RECORD_MAX_SECONDS = 10 * 60
export const VIDEO_RECORD_MAX_SECONDS = 2 * 60
