/** Stable id so we replace the same node instead of stacking hoistable sheets. */
function cssResourceHref(href: string, css: string): string {
  let hash = 2166136261
  for (let i = 0; i < css.length; i += 1) {
    hash ^= css.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return `${href}-${(hash >>> 0).toString(36)}`
}

/**
 * Injects theme CSS for the public card and the builder phone preview.
 *
 * Do not use React 19 hoistable `<style href precedence>` here: rapid color /
 * wallpaper edits could leave the previous sheet mounted until a hard refresh.
 * A plain keyed `<style>` updates in place on every change.
 */
export function HoistableStyle({ href, css }: { href: string; css: string }) {
  if (!css.trim()) return null
  const resourceHref = cssResourceHref(href, css)
  return <style key={resourceHref} data-vbiz-style={resourceHref} dangerouslySetInnerHTML={{ __html: css }} />
}
