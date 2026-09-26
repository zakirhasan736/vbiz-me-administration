import {
  isEntityTooLargeResponse,
  isMultipartTruncatedMessage,
  mediaUploadInterruptedMessage,
  mediaUploadRejectedTooLargeMessage,
  mediaUploadTransportErrorMessage,
  sanitizeUploadFileName,
  sanitizeUploadMimeType,
  toMultipartFile,
} from '@/lib/media/uploadMediaWithProgress'
import { describe, expect, it } from 'vitest'

describe('upload media error mapping', () => {
  it('detects proxy and Express 413 payloads', () => {
    expect(isEntityTooLargeResponse(413, '')).toBe(true)
    expect(isEntityTooLargeResponse(0, 'Request Entity Too Large')).toBe(true)
    expect(isEntityTooLargeResponse(500, 'payload too large')).toBe(true)
    expect(isEntityTooLargeResponse(400, 'invalid file')).toBe(false)
  })

  it('uses generic transport errors instead of inventing a client size cap', () => {
    expect(mediaUploadTransportErrorMessage()).toBe('Upload failed. Check your connection and try again.')
    expect(mediaUploadRejectedTooLargeMessage()).toContain('rejected')
    expect(mediaUploadInterruptedMessage()).toContain('interrupted')
    expect(isMultipartTruncatedMessage('Unexpected end of form')).toBe(true)
    expect(isMultipartTruncatedMessage('invalid file')).toBe(false)
  })

  it('strips codec params so multer can parse the multipart part', () => {
    expect(sanitizeUploadMimeType({ type: 'video/mp4;codecs=avc1.42E01E,mp4a.40.2', name: 'clip.mp4' })).toBe(
      'video/mp4'
    )
    expect(sanitizeUploadMimeType({ type: '', name: 'photo.HEIC' })).toBe('image/heic')
    expect(sanitizeUploadFileName('Barry DeHart / avatar?.jpg')).toBe('Barry DeHart _ avatar_.jpg')
    const dirty = new File([new Uint8Array(8)], 'face.png', { type: 'image/png;foo=bar' })
    const clean = toMultipartFile(dirty)
    expect(clean.type).toBe('image/png')
    expect(clean.name).toBe('face.png')
  })
})
