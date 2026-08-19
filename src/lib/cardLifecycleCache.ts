export type CardLifecycleBucket = 'active' | 'draft'

export function nextDraftFlag(body: { isDraft?: unknown }, wasDraft: boolean): boolean {
  return typeof body.isDraft === 'boolean' ? body.isDraft : wasDraft
}

export function queryLifecycle(args: unknown): CardLifecycleBucket | undefined {
  if (!args || typeof args !== 'object') return undefined
  const lifecycle = (args as { lifecycle?: unknown }).lifecycle
  return lifecycle === 'active' || lifecycle === 'draft' ? lifecycle : undefined
}

export function adjustLifecycleTotal(
  total: number,
  lifecycle: CardLifecycleBucket | undefined,
  wasDraft: boolean,
  nextIsDraft: boolean
): number {
  if (!lifecycle || wasDraft === nextIsDraft || !Number.isFinite(total)) return total
  if (wasDraft && !nextIsDraft) {
    if (lifecycle === 'draft') return Math.max(0, total - 1)
    if (lifecycle === 'active') return total + 1
  }
  if (!wasDraft && nextIsDraft) {
    if (lifecycle === 'active') return Math.max(0, total - 1)
    if (lifecycle === 'draft') return total + 1
  }
  return total
}

export function shouldRemoveFromLifecycleList(
  lifecycle: CardLifecycleBucket | undefined,
  wasDraft: boolean,
  nextIsDraft: boolean
): boolean {
  if (!lifecycle || wasDraft === nextIsDraft) return false
  return lifecycle === (wasDraft ? 'draft' : 'active')
}

export function shouldInsertIntoLifecycleList(
  lifecycle: CardLifecycleBucket | undefined,
  wasDraft: boolean,
  nextIsDraft: boolean
): boolean {
  if (!lifecycle || wasDraft === nextIsDraft) return false
  return lifecycle === (nextIsDraft ? 'draft' : 'active')
}
