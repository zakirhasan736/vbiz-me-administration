const IGNORED_MESSAGE_PATTERNS: RegExp[] = [
  /^script error\.?$/i,
  // Chrome sometimes reports a minified window error as only this word.
  /^uncaught$/i,
  /resizeobserver loop/i,
  /undelivered notifications/i,
  /unexpected end of form/i,
  /the i\/o read operation failed/i,
  /has no method ['"]?updateFrom/i,
  /updateFrom is not a function/i,
  /cannot read properties of null \(reading ['"]removeChild['"]\)/i,
  /null is not an object \(evaluating .*\.removeChild/i,
  /notanerror/i,
  /^\[object Event\]$/i,
  /^\[object Object\]$/i,
  /chunkloaderror/i,
  /failed to load chunk/i,
  /loading chunk .+\sfailed/i,
  /failed to fetch dynamically imported module/i,
  /error loading dynamically imported module/i,
  /importing a module script failed/i,
  /abort(ed|error)/i,
  /the operation was aborted/i,
  /play\(\) request was interrupted/i,
  /the play\(\) request was interrupted/i,
  // Safari/WebKit media-controls bug (NullMedia.buffered/played/seekable → EmptyRanges).
  // https://bugs.webkit.org/show_bug.cgi?id=318284 — not application code.
  /can't find variable:\s*EmptyRanges/i,
  /EmptyRanges is not defined/i,
  // Expected team-member rule. The editor already toasts it; it is not a crash.
  /added by the corporate team owner and cannot be (edited or )?removed/i,
  // Generic card-save toast. The editor already shows it; the rejection has no cause.
  /^failed to save changes$/i,
  // Safari fires a window error whose message is only this word when a promise
  // rejects. It has no stack or reason, so it is not a diagnosable crash.
  /^unhandledrejection$/i,
  /^event:unhandledrejection$/i,
  // Chrome sometimes rejects with a bare Event (type "error") and no message.
  /^event:error$/i,
]

export function sentryReasonToMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message || reason.name
  if (typeof reason === 'string') return reason
  if (reason && typeof reason === 'object') {
    const eventLike = reason as {
      message?: unknown
      type?: unknown
      reason?: unknown
      data?: { message?: unknown }
      error?: unknown
    }
    if (typeof eventLike.message === 'string' && eventLike.message.trim()) return eventLike.message
    if (typeof eventLike.data?.message === 'string' && eventLike.data.message.trim()) return eventLike.data.message
    if (typeof eventLike.error === 'string' && eventLike.error.trim()) return eventLike.error
    if (typeof eventLike.reason === 'string' && eventLike.reason.trim()) return eventLike.reason
    return ''
  }
  return ''
}

export function shouldIgnoreSentryMessage(message: string): boolean {
  const text = (message || '').trim()
  if (!text) return true
  return IGNORED_MESSAGE_PATTERNS.some((pattern) => pattern.test(text))
}
