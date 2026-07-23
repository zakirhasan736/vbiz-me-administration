'use client'

import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { cn } from '@/utils/cn'

function scrollStorageKey(slug: string, variant: 'v1' | 'v2'): string {
  return `profile-nav:${variant}:${slug.trim().toLowerCase()}`
}

/**
 * wheel-to-scroll, mouse drag with momentum, touch pan, persisted scrollLeft.
 */
export function useProfileNavScroll(slug: string | undefined, variant: 'v1' | 'v2', restoreWhen?: unknown) {
  const key = slug?.trim() ? scrollStorageKey(slug, variant) : undefined
  const { scrollRef, scrollClassName } = useHorizontalScroll(key, restoreWhen)

  return {
    scrollRef,
    scrollClassName: cn(scrollClassName, 'cursor-grab [-webkit-overflow-scrolling:touch] active:cursor-grabbing'),
  }
}
