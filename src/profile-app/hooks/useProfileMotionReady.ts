'use client'

import { useEffect, useState } from 'react'

/**
 * Defers heavy section animations until after the first paint so initial content
 * appears faster. Respects prefers-reduced-motion.
 */
export function useProfileMotionReady() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let cancelled = false
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (!cancelled) setReady(true)
      })
    })

    return () => {
      cancelled = true
      window.cancelAnimationFrame(id)
    }
  }, [])

  return ready
}
