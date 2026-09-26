const BLOCK_TAG = /<(p|h[1-6]|ul|ol|li|blockquote|pre|table|div)\b/i

/** Wrap loose TipTap output so public-card CSS (p / headings) and text color always apply. */
export function normalizeRichTextHtml(html: string): string {
  const trimmed = (html || '').trim()
  if (!trimmed || trimmed === '<p></p>' || trimmed === '<p><br></p>' || trimmed === '<p><br/></p>') {
    return '<p></p>'
  }
  if (BLOCK_TAG.test(trimmed)) return trimmed
  return `<p>${trimmed}</p>`
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
