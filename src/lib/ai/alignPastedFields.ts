function stripTags(value: string): string {
  return value
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Drop a leading dash, quote, or "by" so "— Michelle R." is a name. */
export function cleanShortLabel(value: string): string {
  return stripTags(value)
    .replace(/^[\s"'“”‘’—–\-•*]+/, '')
    .replace(/[\s"'“”‘’]+$/, '')
    .replace(/^(by|from|reviewer|author|written by|name)\s*[:\-]?\s+/i, '')
    .trim()
}

function wordCount(value: string): number {
  return value.split(/\s+/).filter(Boolean).length
}

export function looksLikeShortLabel(value: string): boolean {
  const text = cleanShortLabel(value)
  if (!text || text.length > 90) return false
  const words = wordCount(text)
  if (words === 0 || words > 10) return false
  if ((text.match(/\?/g) || []).length > 1) return false
  if ((text.match(/[.!]/g) || []).length > 1) return false
  return true
}

export function looksLikeLongBody(value: string): boolean {
  const text = stripTags(value)
  if (!text) return false
  if (text.length >= 80) return true
  const words = wordCount(text)
  if (words >= 12) return true
  return words >= 8 && /[.!?]/.test(text)
}

export function shouldSwapLabelAndBody(label: string, body: string): boolean {
  const labelPlain = stripTags(label)
  const bodyPlain = stripTags(body)
  if (!labelPlain || !bodyPlain) return false
  if (!looksLikeLongBody(labelPlain) || !looksLikeShortLabel(bodyPlain)) return false
  return labelPlain.length > bodyPlain.length + 12
}

/**
 * Paste order is not field order. A paragraph in the name slot and a short name
 * in the body slot are swapped so each piece lands in the field it belongs to.
 */
export function alignLabelAndBody(label: string, body: string, cleanName = false): { label: string; body: string } {
  if (!shouldSwapLabelAndBody(label, body)) return { label, body }
  const short = cleanName ? cleanShortLabel(body) : stripTags(body)
  return { label: short, body: stripTags(label) }
}
