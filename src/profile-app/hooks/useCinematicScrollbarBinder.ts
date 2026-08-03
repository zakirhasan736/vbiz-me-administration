'use client'

import { useEffect } from 'react'

const HIDE_DELAY_MS = 900

const EXCLUDED_SCROLLBAR = '.no-scrollbar, .vbiz-floating-nav-scroll, .vbiz-v1-nav-scroll, .vbiz-profile-root'

function isCinematicScrollTarget(element: HTMLElement): boolean {
  if (element.matches(EXCLUDED_SCROLLBAR)) return false
  if (!element.closest('.vbiz-profile-root')) return false

  const { overflowX, overflowY } = getComputedStyle(element)
  const scrollableX = /auto|scroll/.test(overflowX) && element.scrollWidth > element.clientWidth
  const scrollableY = /auto|scroll/.test(overflowY) && element.scrollHeight > element.clientHeight
  return scrollableX || scrollableY
}

/** Reveals accent scrollbars while the user scrolls (all profile templates). */
export function useCinematicScrollbarBinder(): void {
  useEffect(() => {
    const hideTimers = new WeakMap<HTMLElement, number>()

    const reveal = (element: HTMLElement) => {
      element.setAttribute('data-vbiz-scrollbar-active', '')
      const previous = hideTimers.get(element)
      if (previous !== undefined) window.clearTimeout(previous)
      hideTimers.set(
        element,
        window.setTimeout(() => {
          element.removeAttribute('data-vbiz-scrollbar-active')
        }, HIDE_DELAY_MS)
      )
    }

    const onScroll = (event: Event) => {
      const target = event.target
      if (!(target instanceof HTMLElement)) return
      if (!isCinematicScrollTarget(target)) return
      reveal(target)
    }

    document.addEventListener('scroll', onScroll, { capture: true, passive: true })
    return () => document.removeEventListener('scroll', onScroll, { capture: true })
  }, [])
}
