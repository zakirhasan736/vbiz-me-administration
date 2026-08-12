'use client'

import { useEffect, useRef, useState } from 'react'

const DEFAULT_DURATION_MS = 500

function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value)
}

/**
 * Displays a number that tweens only when the target changes while mounted.
 * First finite value snaps (no page-visit count-up). Later changes animate last → new.
 * Non-finite targets are ignored so mid-fetch undefined does not flash to 0.
 */
export function useAnimatedNumber(value: number | null | undefined, options?: { durationMs?: number }): number {
  const durationMs = options?.durationMs ?? DEFAULT_DURATION_MS
  const [display, setDisplay] = useState(0)
  const displayRef = useRef(0)
  const hasValueRef = useRef(false)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    if (!isFiniteNumber(value)) return

    const to = value

    if (frameRef.current != null) {
      cancelAnimationFrame(frameRef.current)
      frameRef.current = null
    }

    // First finite value after mount: snap (page visits / remounts / cache hits).
    if (!hasValueRef.current) {
      hasValueRef.current = true
      displayRef.current = to
      setDisplay(to)
      return
    }

    const from = displayRef.current

    if (from === to || prefersReducedMotion() || durationMs <= 0) {
      displayRef.current = to
      setDisplay(to)
      return
    }

    const start = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs)
      const next = from + (to - from) * easeOutCubic(t)
      const rounded = t >= 1 ? to : Math.round(next)
      displayRef.current = rounded
      setDisplay(rounded)
      if (t < 1) {
        frameRef.current = requestAnimationFrame(tick)
      } else {
        frameRef.current = null
      }
    }

    frameRef.current = requestAnimationFrame(tick)

    return () => {
      if (frameRef.current != null) {
        cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [value, durationMs])

  return display
}

export default useAnimatedNumber
