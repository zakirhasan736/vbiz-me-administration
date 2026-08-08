/** Move an item within an array by index (immutable). */
export function reorderByIndex<T>(list: T[], fromIndex: number, toIndex: number): T[] {
  if (fromIndex < 0 || toIndex < 0 || fromIndex >= list.length || toIndex >= list.length || fromIndex === toIndex) {
    return list
  }
  const next = [...list]
  const [moved] = next.splice(fromIndex, 1)
  next.splice(toIndex, 0, moved)
  return next
}
