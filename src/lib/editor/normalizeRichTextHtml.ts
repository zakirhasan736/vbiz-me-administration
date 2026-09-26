const BLOCK_TAG = /<(p|h[1-6]|ul|ol|li|blockquote|pre|table|div)\b/i

const NAMED_NEUTRAL = new Set(['black', 'white', 'windowtext', 'inherit', 'currentcolor', 'initial', 'unset'])

function compactColor(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/\s*!important\s*$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/['"]/g, '')
}

/** Default / theme-clobbering colors TipTap bakes into spans under p / headings. */
export function isThemeNeutralColor(raw: string | null | undefined): boolean {
  if (!raw) return true
  const value = compactColor(raw)
  if (!value) return true
  if (NAMED_NEUTRAL.has(value)) return true
  if (/^#(?:000|000000|fff|ffffff|0f172a)$/i.test(value)) return true

  const rgb = value.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/)
  if (rgb) {
    const r = Number(rgb[1])
    const g = Number(rgb[2])
    const b = Number(rgb[3])
    if (r === 0 && g === 0 && b === 0) return true
    if (r >= 250 && g >= 250 && b >= 250) return true
    if (r === 15 && g === 23 && b === 42) return true
  }

  return false
}

function stripNeutralColorFromStyle(style: string): string {
  return style
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const match = part.match(/^color\s*:\s*(.+)$/i)
      if (!match) return true
      return !isThemeNeutralColor(match[1])
    })
    .join('; ')
}

function unwrapBareSpans(html: string): string {
  let next = html
  let prev = ''
  while (prev !== next) {
    prev = next
    next = next.replace(/<span\s*>([\s\S]*?)<\/span>/gi, '$1')
  }
  return next
}

/** Drop black/white color spans so public light/dark text can inherit. Keep picker colors. */
export function stripThemeNeutralColorSpans(html: string): string {
  let next = html.replace(/\sstyle\s*=\s*(["'])([\s\S]*?)\1/gi, (_full, quote: string, style: string) => {
    const kept = stripNeutralColorFromStyle(style)
    return kept ? ` style=${quote}${kept}${quote}` : ''
  })
  next = next.replace(/\scolor\s*=\s*(["'])([\s\S]*?)\1/gi, (_full, quote: string, color: string) =>
    isThemeNeutralColor(color) ? '' : ` color=${quote}${color}${quote}`
  )
  return unwrapBareSpans(next)
}

/** Wrap loose TipTap output so public-card CSS (p / headings) and text color always apply. */
export function normalizeRichTextHtml(html: string): string {
  const trimmed = (html || '').trim()
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>' || trimmed === '<p><br/></p>') {
    return '<p></p>'
  }
  const cleaned = stripThemeNeutralColorSpans(trimmed)
  if (!cleaned || cleaned === '<p></p>' || cleaned === '<p><br></p>' || cleaned === '<p><br/></p>') {
    return '<p></p>'
  }
  if (BLOCK_TAG.test(cleaned)) return cleaned
  return `<p>${cleaned}</p>`
}

export function isTypographyBlockActive(editor: {
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean
}): boolean {
  return (
    editor.isActive('paragraph') ||
    editor.isActive('heading') ||
    editor.isActive('listItem') ||
    editor.isActive('blockquote') ||
    editor.isActive('codeBlock')
  )
}

export function shouldDefaultToParagraph(editor: {
  isActive: (name: string, attrs?: Record<string, unknown>) => boolean
  state: { selection: { $from: { parent: { type: { name: string } } } } }
}): boolean {
  if (isTypographyBlockActive(editor)) return false
  if (editor.isActive('image') || editor.isActive('youtube')) return false
  const name = editor.state.selection.$from.parent.type.name
  return name === 'doc' || name === 'paragraph' || name === 'text'
}
