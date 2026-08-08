'use client'

import { cn } from '@/utils/cn'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

const DRAG_THRESHOLD_PX = 8
const MOMENTUM_FRICTION = 0.94
const MOMENTUM_MIN_VELOCITY = 0.35

const savedScrollPositions = new Map<string, number>()

export function useHorizontalScroll<T extends HTMLElement = HTMLDivElement>(
  persistenceKey?: string,
  restoreWhen?: unknown
) {
  const scrollRef = useRef<T>(null)
  const isPressedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const startXRef = useRef(0)
  const scrollLeftRef = useRef(0)
  const lastXRef = useRef(0)
  const lastTimeRef = useRef(0)
  const velocityRef = useRef(0)
  const momentumFrameRef = useRef<number | null>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [hiddenLeftCount, setHiddenLeftCount] = useState(0)
  const [hiddenRightCount, setHiddenRightCount] = useState(0)

  const stopMomentum = useCallback(() => {
    if (momentumFrameRef.current != null) {
      cancelAnimationFrame(momentumFrameRef.current)
      momentumFrameRef.current = null
    }
  }, [])

  const updateOverflow = useCallback(() => {
    const el = scrollRef.current
    if (!el) {
      setCanScrollLeft(false)
      setCanScrollRight(false)
      setHiddenLeftCount(0)
      setHiddenRightCount(0)
      return
    }

    const maxScroll = el.scrollWidth - el.clientWidth
    const left = el.scrollLeft > 4
    const right = el.scrollLeft < maxScroll - 4
    setCanScrollLeft(left)
    setCanScrollRight(right)

    const chips = Array.from(el.querySelectorAll<HTMLElement>('[data-tab-chip]'))
    if (chips.length === 0) {
      setHiddenLeftCount(left ? 1 : 0)
      setHiddenRightCount(right ? 1 : 0)
      return
    }

    const containerLeft = el.getBoundingClientRect().left
    const containerRight = containerLeft + el.clientWidth
    let hiddenLeft = 0
    let hiddenRight = 0
    for (const chip of chips) {
      const rect = chip.getBoundingClientRect()
      if (rect.right < containerLeft + 8) hiddenLeft += 1
      if (rect.left > containerRight - 8) hiddenRight += 1
    }
    setHiddenLeftCount(hiddenLeft)
    setHiddenRightCount(hiddenRight)
  }, [])

  const runMomentum = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    stopMomentum()

    const step = () => {
      velocityRef.current *= MOMENTUM_FRICTION

      if (Math.abs(velocityRef.current) < MOMENTUM_MIN_VELOCITY) {
        momentumFrameRef.current = null
        updateOverflow()
        return
      }

      el.scrollLeft -= velocityRef.current
      if (persistenceKey) {
        savedScrollPositions.set(persistenceKey, el.scrollLeft)
      }
      momentumFrameRef.current = requestAnimationFrame(step)
    }

    if (Math.abs(velocityRef.current) >= MOMENTUM_MIN_VELOCITY) {
      momentumFrameRef.current = requestAnimationFrame(step)
    }
  }, [persistenceKey, stopMomentum, updateOverflow])

  const getChips = useCallback(() => {
    const el = scrollRef.current
    if (!el) return []
    return Array.from(el.querySelectorAll<HTMLElement>('[data-tab-chip]'))
  }, [])

  /**
   * Bidirectional window around a chip:
   * show up to 2 tabs on the LEFT and 2 on the RIGHT of the anchor.
   */
  const scrollWindowAroundIndex = useCallback(
    (idx: number, smooth = true) => {
      const el = scrollRef.current
      if (!el) return
      const buttons = getChips()
      if (!buttons.length) return
      const i = Math.max(0, Math.min(idx, buttons.length - 1))
      const pad = 10

      const leftIdx = Math.max(0, i - 2)
      const rightIdx = Math.min(buttons.length - 1, i + 2)
      const leftEdge = buttons[leftIdx].offsetLeft - pad
      const rightEdge = buttons[rightIdx].offsetLeft + buttons[rightIdx].offsetWidth + pad
      const span = rightEdge - leftEdge
      const maxScroll = Math.max(0, el.scrollWidth - el.clientWidth)

      let nextLeft: number
      if (span <= el.clientWidth) {
        nextLeft = leftEdge
        const activeCenter = buttons[i].offsetLeft + buttons[i].offsetWidth / 2 - el.clientWidth / 2
        nextLeft = Math.min(leftEdge, Math.max(activeCenter, leftEdge))
        if (rightEdge - nextLeft > el.clientWidth) {
          nextLeft = rightEdge - el.clientWidth
        }
        if (buttons[leftIdx].offsetLeft < nextLeft) {
          nextLeft = Math.max(0, buttons[leftIdx].offsetLeft - pad)
        }
      } else {
        const active = buttons[i]
        nextLeft = active.offsetLeft + active.offsetWidth / 2 - el.clientWidth / 2
      }

      const left = Math.max(0, Math.min(nextLeft, maxScroll))
      el.scrollTo({
        left,
        behavior: smooth ? 'smooth' : 'auto',
      })
      if (persistenceKey) {
        savedScrollPositions.set(persistenceKey, left)
      }
      window.setTimeout(updateOverflow, smooth ? 320 : 40)
    },
    [getChips, persistenceKey, updateOverflow]
  )

  /** Shift by exactly 2 tabs — works both left (−1) and right (+1) */
  const scrollByTabs = useCallback(
    (direction: number) => {
      const el = scrollRef.current
      if (!el) return
      const buttons = getChips()
      if (!buttons.length) return

      const dir = Math.sign(direction || 1) as 1 | -1
      const mid = el.scrollLeft + el.clientWidth / 2
      let focusIdx = 0
      let best = Infinity
      buttons.forEach((b, i) => {
        const c = b.offsetLeft + b.offsetWidth / 2
        const d = Math.abs(c - mid)
        if (d < best) {
          best = d
          focusIdx = i
        }
      })

      const target = Math.max(0, Math.min(focusIdx + dir * 2, buttons.length - 1))
      scrollWindowAroundIndex(target, true)
    },
    [getChips, scrollWindowAroundIndex]
  )

  /** On active change: show 2 tabs before AND 2 after the active tab */
  const scrollActiveIntoPeek = useCallback(
    (activeName: string) => {
      const buttons = getChips()
      const idx = buttons.findIndex((b) => b.dataset.tabName === activeName)
      if (idx < 0) return
      scrollWindowAroundIndex(idx, true)
    },
    [getChips, scrollWindowAroundIndex]
  )

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !persistenceKey) return

    const saved = savedScrollPositions.get(persistenceKey)
    if (saved != null) {
      el.scrollLeft = saved
    }
    updateOverflow()
  }, [persistenceKey, restoreWhen, updateOverflow])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const clearPressState = () => {
      isPressedRef.current = false
      isDraggingRef.current = false
      pointerIdRef.current = null
      delete el.dataset.dragging
    }

    const saveScrollPosition = () => {
      if (persistenceKey) {
        savedScrollPositions.set(persistenceKey, el.scrollLeft)
      }
    }

    const onDocumentPointerMove = (e: PointerEvent) => {
      if (!isPressedRef.current || e.pointerId !== pointerIdRef.current) return

      const delta = e.pageX - startXRef.current

      if (!isDraggingRef.current && Math.abs(delta) > DRAG_THRESHOLD_PX) {
        isDraggingRef.current = true
        didDragRef.current = true
        el.dataset.dragging = 'true'
      }

      if (!isDraggingRef.current) return

      e.preventDefault()

      const now = performance.now()
      const elapsed = now - lastTimeRef.current
      if (elapsed > 0) {
        velocityRef.current = ((e.pageX - lastXRef.current) / elapsed) * 16
      }
      lastXRef.current = e.pageX
      lastTimeRef.current = now

      el.scrollLeft = scrollLeftRef.current - delta
      saveScrollPosition()
      updateOverflow()
    }

    const onDocumentPointerUp = (e: PointerEvent) => {
      if (!isPressedRef.current || e.pointerId !== pointerIdRef.current) return

      document.removeEventListener('pointermove', onDocumentPointerMove)
      document.removeEventListener('pointerup', onDocumentPointerUp)
      document.removeEventListener('pointercancel', onDocumentPointerUp)

      const wasDragging = isDraggingRef.current
      clearPressState()

      if (wasDragging) {
        saveScrollPosition()
        runMomentum()
      } else {
        didDragRef.current = false
      }
      updateOverflow()
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType !== 'mouse') return

      stopMomentum()
      isPressedRef.current = true
      isDraggingRef.current = false
      didDragRef.current = false
      pointerIdRef.current = e.pointerId
      startXRef.current = e.pageX
      scrollLeftRef.current = el.scrollLeft
      lastXRef.current = e.pageX
      lastTimeRef.current = performance.now()
      velocityRef.current = 0

      document.addEventListener('pointermove', onDocumentPointerMove)
      document.addEventListener('pointerup', onDocumentPointerUp)
      document.addEventListener('pointercancel', onDocumentPointerUp)
    }

    const onClickCapture = (e: MouseEvent) => {
      if (!didDragRef.current) return
      e.preventDefault()
      e.stopPropagation()
      didDragRef.current = false
    }

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return

      stopMomentum()
      el.scrollLeft += e.deltaY
      saveScrollPosition()
      updateOverflow()
      e.preventDefault()
    }

    const onScroll = () => {
      saveScrollPosition()
      updateOverflow()
    }

    el.addEventListener('pointerdown', onPointerDown, { capture: true })
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', updateOverflow)
    updateOverflow()

    return () => {
      stopMomentum()
      saveScrollPosition()
      document.removeEventListener('pointermove', onDocumentPointerMove)
      document.removeEventListener('pointerup', onDocumentPointerUp)
      document.removeEventListener('pointercancel', onDocumentPointerUp)
      el.removeEventListener('pointerdown', onPointerDown, { capture: true })
      el.removeEventListener('click', onClickCapture, true)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', updateOverflow)
      delete el.dataset.dragging
    }
  }, [persistenceKey, runMomentum, stopMomentum, updateOverflow])

  const scrollClassName = cn(
    'no-scrollbar w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain',
    'flex touch-pan-x flex-nowrap',
    '[&[data-dragging=true]]:cursor-grabbing [&[data-dragging=true]]:select-none'
  )

  return {
    scrollRef,
    scrollClassName,
    didDragRef,
    canScrollLeft,
    canScrollRight,
    hiddenLeftCount,
    hiddenRightCount,
    scrollByTabs,
    scrollActiveIntoPeek,
    updateOverflow,
  }
}
