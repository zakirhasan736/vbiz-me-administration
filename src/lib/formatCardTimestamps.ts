/** Compact date for card list chips — absolute calendar day. */
export function formatCardDate(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

/** Full date+time for tooltip / title. */
export function formatCardDateTime(iso?: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Smart label for list cards: relative when recent, calendar date when older.
 * e.g. "Just now", "2h ago", "Yesterday", "Mar 12, 2026"
 */
export function formatCardTimestampLabel(iso?: string | null, nowMs = Date.now()): string {
  if (!iso) return ''
  const date = new Date(iso)
  const ms = date.getTime()
  if (Number.isNaN(ms)) return ''

  const diffMs = nowMs - ms
  if (diffMs < 0) return formatCardDate(iso)

  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour

  if (diffMs < minute) return 'Just now'
  if (diffMs < hour) {
    const mins = Math.floor(diffMs / minute)
    return `${mins}m ago`
  }
  if (diffMs < day) {
    const hours = Math.floor(diffMs / hour)
    return `${hours}h ago`
  }
  if (diffMs < 2 * day) return 'Yesterday'
  if (diffMs < 7 * day) {
    const days = Math.floor(diffMs / day)
    return `${days}d ago`
  }

  return formatCardDate(iso)
}

export function cardTimestampsEqual(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (Number.isNaN(ta) || Number.isNaN(tb)) return a === b
  return Math.abs(ta - tb) < 1000
}
