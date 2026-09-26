const IGNORED_MESSAGE_PATTERNS: RegExp[] = [
  /^script error\.?$/i,
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
  /loading chunk \d+ failed/i,
  /failed to fetch dynamically imported module/i,
  /abort(ed|error)/i,
  /the operation was aborted/i,
  /play\(\) request was interrupted/i,
  /the play\(\) request was interrupted/i,
]

export function sentryReasonToMessage(reason: unknown): string {
  if (reason instanceof Error) return reason.message || reason.name
  if (typeof reason === 'string') return reason
  if (reason && typeof reason === 'object') {
    const eventLike = reason as { message?: unknown; type?: unknown; reason?: unknown }
    if (typeof eventLike.message === 'string' && eventLike.message.trim()) return eventLike.message
    if (typeof eventLike.reason === 'string' && eventLike.reason.trim()) return eventLike.reason
    if (typeof eventLike.type === 'string' && eventLike.type.trim()) return `event:${eventLike.type}`
  }
  return String(reason || 'unhandledrejection')
}

export function shouldIgnoreSentryMessage(message: string): boolean {
  const text = (message || '').trim()
  if (!text) return true
  return IGNORED_MESSAGE_PATTERNS.some((pattern) => pattern.test(text))
}
