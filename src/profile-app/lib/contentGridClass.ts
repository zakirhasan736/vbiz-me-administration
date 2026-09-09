import { cn } from '@/utils/cn'

const GRID_COLS_TOKEN = /^(?:(sm|md|lg|xl):)?grid-cols-(\d+)$/

/** Clamp each breakpoint's grid-cols-N to min(N, count); omit tokens that clamp to 1. */
function clampMultiColClasses(multiColWhenMany: string, count: number): string {
  return multiColWhenMany
    .split(/\s+/)
    .filter(Boolean)
    .map((token) => {
      const match = GRID_COLS_TOKEN.exec(token)
      if (!match) return token

      const prefix = match[1]
      const definedCols = Number(match[2])
      const cols = Math.min(definedCols, count)
      if (cols <= 1) return null

      return prefix ? `${prefix}:grid-cols-${cols}` : `grid-cols-${cols}`
    })
    .filter((token): token is string => Boolean(token))
    .join(' ')
}

/**
 * Full-width single column when count is 1; otherwise section multi-col classes
 * with each breakpoint clamped to at most `count` columns so sparse grids fill width.
 */
export function contentGridClass(count: number, multiColWhenMany: string, base = 'grid grid-cols-1 gap-4') {
  if (count <= 1 || !multiColWhenMany.trim()) {
    return cn(base)
  }

  return cn(base, clampMultiColClasses(multiColWhenMany, count))
}
