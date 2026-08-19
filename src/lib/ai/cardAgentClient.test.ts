import { CardAgentError, classifyNetworkError, formatCardAgentError } from '@/lib/ai/cardAgentClient'
import { describe, expect, it } from 'vitest'

describe('AI Builder client errors', () => {
  it('does not show raw Failed to fetch', () => {
    const formatted = formatCardAgentError(new TypeError('Failed to fetch'))
    expect(formatted.toLowerCase()).not.toContain('failed to fetch')
    expect(formatted).toContain("couldn't reach the vBiz Me AI service")
  })

  it('maps network exceptions to NETWORK_ERROR', () => {
    const error = classifyNetworkError(new TypeError('Failed to fetch'), 'req-1')
    expect(error).toBeInstanceOf(CardAgentError)
    expect(error.code).toBe('NETWORK_ERROR')
    expect(error.requestId).toBe('req-1')
    expect(error.retryable).toBe(true)
    expect(formatCardAgentError(error)).toContain('Reference: req-1')
  })

  it('keeps scraper, document, AI, and timeout codes as product copy', () => {
    expect(formatCardAgentError(new CardAgentError('raw', 422, 'WEBSITE_FETCH_FAILED', 'r2', true))).toContain(
      "couldn't read that website"
    )
    expect(formatCardAgentError(new CardAgentError('raw', 422, 'DOCUMENT_READ_FAILED', 'r3', true))).toContain(
      'document'
    )
    expect(formatCardAgentError(new CardAgentError('raw', 500, 'AI_PLANNING_FAILED', 'r4', true))).toContain(
      "couldn't finish planning"
    )
    expect(formatCardAgentError(new CardAgentError('raw', 0, 'TIMEOUT', 'r5', true))).toContain('too long')
  })

  it('includes request ids on recoverable server errors', () => {
    const text = formatCardAgentError(
      new CardAgentError("We couldn't finish analyzing that source.", 422, 'SOURCE_ANALYSIS_FAILED', 'abc-123', true)
    )
    expect(text).toContain('Reference: abc-123')
    expect(text.toLowerCase()).not.toContain('failed to fetch')
  })
})
