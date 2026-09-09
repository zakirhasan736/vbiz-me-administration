import { cn } from '@/utils/cn'

/** Full-width single column when count is 1; section multi-col classes when count > 1. */
export function contentGridClass(count: number, multiColWhenMany: string, base = 'grid grid-cols-1 gap-4') {
  return cn(base, count > 1 && multiColWhenMany)
}
