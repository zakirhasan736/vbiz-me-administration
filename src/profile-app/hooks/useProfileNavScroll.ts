'use client'

import { useHorizontalScroll } from '@/hooks/useHorizontalScroll'
import { cn } from '@/utils/cn'
import { useCallback, useEffect, useRef, useState } from 'react'

function scrollStorageKey(slug: string, variant: 'v1' | 'v2' | 'v3'): string {
  return `profile-nav:${variant}:${slug.trim().toLowerCase()}`
}

/** Wheel-to-scroll, mouse drag with momentum, touch pan, persisted scrollLeft, edge arrows, tab scroll-into-view. */
export function useProfileNavScroll(
  slug: string | undefined,
  variant: 'v1' | 'v2' | 'v3',
  activeTabId?: string,
  tabIdPrefix = 'tab-btn'
) {
  const key = slug?.trim() ? scrollStorageKey(slug, variant) : undefined
  const { scrollRef, scrollClassName, didDragRef } = useHorizontalScroll(key, slug)
  const skipAutoScrollRef = useRef(true)

  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const checkScrollLimits = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    const { scrollLeft, scrollWidth, clientWidth } = el
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 4)
  }, [scrollRef])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    checkScrollLimits()
    el.addEventListener('scroll', checkScrollLimits)
    window.addEventListener('resize', checkScrollLimits)

    const timer = window.setTimeout(checkScrollLimits, 250)

    return () => {
      el.removeEventListener('scroll', checkScrollLimits)
      window.removeEventListener('resize', checkScrollLimits)
      window.clearTimeout(timer)
    }
  }, [scrollRef, activeTabId, checkScrollLimits])

  const scrollToEdge = useCallback(
    (direction: 'left' | 'right') => {
      const el = scrollRef.current
      if (!el) return
      const { scrollWidth, clientWidth } = el
      el.scrollTo({
        left: direction === 'left' ? 0 : scrollWidth - clientWidth,
        behavior: 'smooth',
      })
    },
    [scrollRef]
  )

  const scrollTabIntoView = useCallback(
    (tabId: string, idPrefix = tabIdPrefix) => {
      const container = scrollRef.current
      const buttonEl = document.getElementById(`${idPrefix}-${tabId}`)
      if (!container || !buttonEl) return

      const containerRect = container.getBoundingClientRect()
      const buttonRect = buttonEl.getBoundingClientRect()
      const delta = buttonRect.left + buttonRect.width / 2 - (containerRect.left + containerRect.width / 2)

      if (Math.abs(delta) < 1) return

      container.scrollTo({
        left: container.scrollLeft + delta,
        behavior: 'smooth',
      })
    },
    [scrollRef, tabIdPrefix]
  )

  useEffect(() => {
    if (!activeTabId) return

    if (skipAutoScrollRef.current) {
      skipAutoScrollRef.current = false
      return
    }

    let cancelled = false
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (cancelled) return
        scrollTabIntoView(activeTabId, tabIdPrefix)
      })
    })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
    }
  }, [activeTabId, scrollTabIntoView, tabIdPrefix])

  return {
    scrollRef,
    scrollClassName: cn(scrollClassName, 'cursor-grab [-webkit-overflow-scrolling:touch] active:cursor-grabbing'),
    canScrollLeft,
    canScrollRight,
    scrollToEdge,
    scrollTabIntoView,
    didDragRef,
  }
}
