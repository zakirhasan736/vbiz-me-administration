export const GAME_PLATFORM_ORDER = [
  { id: 'steam', label: 'Steam' },
  { id: 'psn', label: 'PlayStation Network' },
  { id: 'xbox', label: 'Xbox' },
  { id: 'switch', label: 'Nintendo Switch' },
  { id: 'epic', label: 'Epic Games' },
  { id: 'discord', label: 'Discord' },
] as const

export type GamePlatformId = (typeof GAME_PLATFORM_ORDER)[number]['id']

export type VisibleGameId = {
  id: GamePlatformId
  label: string
  value: string
}

/** Filled game IDs in editor/platform order. */
export function getVisibleGameIds(games: Record<string, string> | undefined | null): VisibleGameId[] {
  if (!games) return []
  return GAME_PLATFORM_ORDER.flatMap(({ id, label }) => {
    const value = games[id]?.trim() ?? ''
    return value ? [{ id, label, value }] : []
  })
}

export async function copyGameIdToClipboard(value: string): Promise<boolean> {
  if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) return false
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
