import {
  isEntityTooLargeResponse,
  mediaUploadRejectedTooLargeMessage,
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

  it('uses generic transport errors instead of inventing a client size cap', () => {
    expect(mediaUploadTransportErrorMessage()).toBe('Upload failed. Check your connection and try again.')
    expect(mediaUploadRejectedTooLargeMessage()).toContain('rejected')
  })
})
