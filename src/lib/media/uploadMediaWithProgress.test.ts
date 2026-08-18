import {
  isEntityTooLargeResponse,
  mediaFileTooLargeMessage,
  mediaUploadTransportErrorMessage,
} from '@/lib/media/uploadMediaWithProgress'
import { describe, expect, it } from 'vitest'

describe('upload media error mapping', () => {
  it('detects proxy and Express 413 payloads', () => {
    expect(isEntityTooLargeResponse(413, '')).toBe(true)
    expect(isEntityTooLargeResponse(0, 'Request Entity Too Large')).toBe(true)
    expect(isEntityTooLargeResponse(500, 'payload too large')).toBe(true)
    expect(isEntityTooLargeResponse(400, 'invalid file')).toBe(false)
  })

  it('surfaces a size message when the proxy closes the connection', () => {
    expect(mediaUploadTransportErrorMessage(7.8 * 1024 * 1024, 15 * 1024 * 1024)).toBe(
      mediaFileTooLargeMessage(15 * 1024 * 1024)
    )
    expect(mediaUploadTransportErrorMessage(20 * 1024)).toBe('Upload failed')
  })
})
