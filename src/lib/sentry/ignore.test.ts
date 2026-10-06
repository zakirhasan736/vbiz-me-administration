import { sentryReasonToMessage, shouldIgnoreSentryMessage } from '@/lib/sentry/ignore'
import { describe, expect, it } from 'vitest'

describe('shouldIgnoreSentryMessage', () => {
  it('drops known browser and gadget noise', () => {
    expect(shouldIgnoreSentryMessage('Script error.')).toBe(true)
    expect(shouldIgnoreSentryMessage('Uncaught ')).toBe(true)
    expect(shouldIgnoreSentryMessage('ResizeObserver loop completed with undelivered notifications.')).toBe(true)
    expect(shouldIgnoreSentryMessage('Unexpected end of form')).toBe(true)
    expect(shouldIgnoreSentryMessage('The I/O read operation failed.')).toBe(true)
    expect(shouldIgnoreSentryMessage("Object [object Object] has no method 'updateFrom'")).toBe(true)
    expect(shouldIgnoreSentryMessage("Cannot read properties of null (reading 'removeChild')")).toBe(true)
    expect(
      shouldIgnoreSentryMessage("Uncaught TypeError: Cannot read properties of null (reading 'removeChild')")
    ).toBe(true)
    expect(shouldIgnoreSentryMessage('[object Event]')).toBe(true)
    expect(
      shouldIgnoreSentryMessage(
        'ChunkLoadError: Failed to load chunk /_next/static/chunks/0m0ly~zyp_cgo.js from module 435657'
      )
    ).toBe(true)
    expect(shouldIgnoreSentryMessage('Loading chunk 435657 failed.')).toBe(true)
    expect(
      shouldIgnoreSentryMessage(
        'Uncaught ChunkLoadError: Failed to load chunk /_next/static/chunks/0ogktlug8zgmb.js from module 964893'
      )
    ).toBe(true)
    expect(
      shouldIgnoreSentryMessage("null is not an object (evaluating '(n=n.stateNode).parentNode.removeChild')")
    ).toBe(true)
    expect(shouldIgnoreSentryMessage("ReferenceError: Can't find variable: EmptyRanges")).toBe(true)
    expect(shouldIgnoreSentryMessage('Uncaught ReferenceError: EmptyRanges is not defined')).toBe(true)
    expect(
      shouldIgnoreSentryMessage(
        'This item was added by the corporate team owner and cannot be edited or removed on a team member card. (Reference: f4bfbbce-f7f0-4dfe-a0ae-d47501e958f2)'
      )
    ).toBe(true)
    expect(
      shouldIgnoreSentryMessage(
        'This item was added by the corporate team owner and cannot be removed on a team member card. (Reference: abc)'
      )
    ).toBe(true)
    expect(shouldIgnoreSentryMessage('unhandledrejection')).toBe(true)
    expect(shouldIgnoreSentryMessage('Failed to save changes')).toBe(true)
    expect(shouldIgnoreSentryMessage('event:error')).toBe(true)
  })

  it('keeps real application errors', () => {
    expect(shouldIgnoreSentryMessage("Cannot read properties of undefined (reading 'id')")).toBe(false)
    expect(shouldIgnoreSentryMessage('Upload failed (500)')).toBe(false)
    expect(shouldIgnoreSentryMessage('Uncaught TypeError: x is not a function')).toBe(false)
  })
})

describe('sentryReasonToMessage', () => {
  it('reads Error and Event-like values instead of [object Event]', () => {
    expect(sentryReasonToMessage(new Error('boom'))).toBe('boom')
    expect(sentryReasonToMessage({ type: 'error', message: '' })).toBe('')
    expect(sentryReasonToMessage({ message: 'Unexpected end of form' })).toBe('Unexpected end of form')
    expect(sentryReasonToMessage(undefined)).toBe('')
    expect(sentryReasonToMessage({ data: { message: 'Save failed (500)' } })).toBe('Save failed (500)')
  })
})
