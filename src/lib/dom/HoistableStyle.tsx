/** New href when the CSS changes so the preview and public card pick up colors immediately. */
function cssResourceHref(href: string, css: string): string {
  let hash = 2166136261
  for (let i = 0; i < css.length; i += 1) {
    hash ^= css.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `${href}-${(hash >>> 0).toString(36)}`
}

/** React 19 resource stylesheet. A color change replaces the sheet instead of leaving the previous one mounted. */
export function HoistableStyle({ href, css }: { href: string; css: string }) {
  if (!css.trim()) return null
  return <style href={cssResourceHref(href, css)} precedence="medium" dangerouslySetInnerHTML={{ __html: css }} />
}
