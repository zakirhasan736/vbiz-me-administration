const HTML_ENTITIES: Record<string, string> = {
  amp: '&',
  apos: "'",
  cent: '¢',
  copy: '©',
  deg: '°',
  divide: '÷',
  emdash: '—',
  ensp: ' ',
  euro: '€',
  gt: '>',
  hellip: '…',
  laquo: '«',
  lt: '<',
  mdash: '—',
  middot: '·',
  ndash: '–',
  nbsp: ' ',
  pound: '£',
  quot: '"',
  raquo: '»',
  reg: '®',
  rsquo: '’',
  shy: '',
  times: '×',
  trade: '™',
  yen: '¥',
  zwj: '',
  zwnj: '',
}

/** Decode named and numeric HTML entities; repeat once for double-encoded payloads. */
export function decodeHtmlEntities(value: string): string {
  const decoded = value.replace(/&(#(?:x[\da-f]+|\d+)|[a-z][a-z\d]+);/gi, (match, entity: string) => {
    if (entity.startsWith('#')) {
      const isHex = entity[1]?.toLowerCase() === 'x'
      const codePoint = Number.parseInt(entity.slice(isHex ? 2 : 1), isHex ? 16 : 10)

      if (!Number.isFinite(codePoint) || codePoint <= 0 || codePoint > 0x10ffff) return match

      try {
        return String.fromCodePoint(codePoint)
      } catch {
        return match
      }
    }

    return HTML_ENTITIES[entity.toLowerCase()] ?? match
  })

  return decoded
}

export function decodeHtmlText(value: string): string {
  let decoded = value
  for (let pass = 0; pass < 2; pass += 1) {
    const next = decodeHtmlEntities(decoded)
    if (next === decoded) break
    decoded = next
  }
  return decoded
}

/** Escape plain text before wrapping as rich-text HTML. */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

/**
 * Turn pasted plain text into HTML paragraphs for TipTap / rich-text fields.
 * Leaves existing HTML alone.
 */
export function plainTextToRichHtml(value: string): string {
  const text = value.replace(/\r\n/g, '\n').trim()
  if (!text) return ''
  if (/<[a-z][\s\S]*>/i.test(text)) return text

  const blocks = text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)

  if (blocks.length <= 1) {
    const lines = text
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
    return lines.map((line) => `<p>${escapeHtml(line)}</p>`).join('')
  }

  return blocks.map((block) => `<p>${escapeHtml(block.replace(/\n+/g, ' '))}</p>`).join('')
}

export function stripHtml(html: string): string {
  let decoded = html

  for (let pass = 0; pass < 2; pass += 1) {
    const next = decodeHtmlEntities(decoded)
    if (next === decoded) break
    decoded = next
  }

  return decoded
    .replace(/<!--[^]*?-->/g, ' ')
    .replace(/<(script|style|template)\b[^>]*>[^]*?<\/\1\s*>/gi, ' ')
    .replace(/<\s*br\s*\/?>/gi, ' ')
    .replace(/<\/\s*(?:p|div|li|ol|ul|blockquote|h[1-6])\s*>/gi, ' ')
    .replace(/<\/?[a-z][^>]*>/gi, ' ')
    .replace(/\u00a0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
