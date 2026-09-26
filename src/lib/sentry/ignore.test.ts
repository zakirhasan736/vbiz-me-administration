import { sentryReasonToMessage, shouldIgnoreSentryMessage } from '@/lib/sentry/ignore'
import { describe, expect, it } from 'vitest'

describe('shouldIgnoreSentryMessage', () => {
  it('drops known browser and gadget noise', () => {
    expect(shouldIgnoreSentryMessage('Script error.')).toBe(true)
    expect(shouldIgnoreSentryMessage('ResizeObserver loop completed with undelivered notifications.')).toBe(true)
    expect(shouldIgnoreSentryMessage('Unexpected end of form')).toBe(true)
    expect(shouldIgnoreSentryMessage('The I/O read operation failed.')).toBe(true)
    expect(shouldIgnoreSentryMessage("Object [object Object] has no method 'updateFrom'")).toBe(true)
    expect(shouldIgnoreSentryMessage("Cannot read properties of null (reading 'removeChild')")).toBe(true)
    expect(shouldIgnoreSentryMessage('[object Event]')).toBe(true)
    expect(
      shouldIgnoreSentryMessage("null is not an object (evaluating '(n=n.stateNode).parentNode.removeChild')")
    ).toBe(true)
  })

  it('keeps real application errors', () => {
    expect(shouldIgnoreSentryMessage("Cannot read properties of undefined (reading 'id')")).toBe(false)
    expect(shouldIgnoreSentryMessage('Upload failed (500)')).toBe(false)
  })
})

describe('sentryReasonToMessage', () => {
  it('reads Error and Event-like values instead of [object Event]', () => {
    expect(sentryReasonToMessage(new Error('boom'))).toBe('boom')
    expect(sentryReasonToMessage({ type: 'error', message: '' })).toBe('event:error')
    expect(sentryReasonToMessage({ message: 'Unexpected end of form' })).toBe('Unexpected end of form')
  })
})
