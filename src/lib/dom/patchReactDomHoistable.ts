/**
 * React 19 HostHoistable unmount does `node.parentNode.removeChild(node)` with no
 * null check. Next CSS / <style> / <link> can already be detached (navigation,
 * Google Translate, extensions) → Uncaught TypeError removeChild on null.
 */
export const HOISTABLE_REMOVECHILD_GUARDS: Array<[from: string, to: string]> = [
  [
    'deletedFiber.parentNode.removeChild(deletedFiber)',
    'deletedFiber.parentNode&&deletedFiber.parentNode.removeChild(deletedFiber)',
  ],
  [
    'finishedRoot.parentNode.removeChild(finishedRoot)',
    'finishedRoot.parentNode&&finishedRoot.parentNode.removeChild(finishedRoot)',
  ],
  ['current.parentNode.removeChild(current)', 'current.parentNode&&current.parentNode.removeChild(current)'],
]

export function applyHoistableRemoveChildGuards(source: string): string {
  let next = source
  for (const [from, to] of HOISTABLE_REMOVECHILD_GUARDS) {
    if (next.includes(to)) continue
    next = next.split(from).join(to)
  }
  return next
}
