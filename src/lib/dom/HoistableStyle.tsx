/** React 19 resource stylesheet — same href updates in place instead of unmounting a detached <style>. */
export function HoistableStyle({ href, css }: { href: string; css: string }) {
  if (!css.trim()) return null
  return <style href={href} precedence="medium" dangerouslySetInnerHTML={{ __html: css }} />
}
