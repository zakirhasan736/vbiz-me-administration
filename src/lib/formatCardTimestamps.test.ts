import { cardTimestampsEqual, formatCardDate, formatCardTimestampLabel } from '@/lib/formatCardTimestamps'
import { describe, expect, it } from 'vitest'

describe('formatCardTimestamps', () => {
  const now = Date.parse('2026-09-10T12:00:00.000Z')

  it('formats relative labels for recent times', () => {
    expect(formatCardTimestampLabel('2026-09-10T11:59:30.000Z', now)).toBe('Just now')
    expect(formatCardTimestampLabel('2026-09-10T10:00:00.000Z', now)).toBe('2h ago')
    expect(formatCardTimestampLabel('2026-09-09T12:00:00.000Z', now)).toBe('Yesterday')
    expect(formatCardTimestampLabel('2026-09-07T12:00:00.000Z', now)).toBe('3d ago')
  })

  it('falls back to calendar date for older times', () => {
    expect(formatCardTimestampLabel('2026-03-12T08:00:00.000Z', now)).toBe(formatCardDate('2026-03-12T08:00:00.000Z'))
  })

  it('detects equal timestamps within one second', () => {
    expect(cardTimestampsEqual('2026-09-10T12:00:00.000Z', '2026-09-10T12:00:00.400Z')).toBe(true)
    expect(cardTimestampsEqual('2026-09-10T12:00:00.000Z', '2026-09-11T12:00:00.000Z')).toBe(false)
  })
})
