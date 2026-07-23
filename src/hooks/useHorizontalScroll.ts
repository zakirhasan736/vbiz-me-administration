'use client'

import { cn } from '@/utils/cn'
import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'

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

  const stopMomentum = useCallback(() => {
    if (momentumFrameRef.current != null) {
      cancelAnimationFrame(momentumFrameRef.current)
      momentumFrameRef.current = null
    }
  }, [])

  const runMomentum = useCallback(() => {
    const el = scrollRef.current
    if (!el) return

    stopMomentum()

    const step = () => {
      velocityRef.current *= MOMENTUM_FRICTION

      if (Math.abs(velocityRef.current) < MOMENTUM_MIN_VELOCITY) {
        momentumFrameRef.current = null
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
  }, [persistenceKey, stopMomentum])

  useLayoutEffect(() => {
    const el = scrollRef.current
    if (!el || !persistenceKey) return

    const saved = savedScrollPositions.get(persistenceKey)
    if (saved != null) {
      el.scrollLeft = saved
    }
  }, [persistenceKey, restoreWhen])

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
      e.preventDefault()
    }

    const onScroll = () => saveScrollPosition()

    el.addEventListener('pointerdown', onPointerDown, { capture: true })
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('wheel', onWheel, { passive: false })
    el.addEventListener('scroll', onScroll, { passive: true })

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
      delete el.dataset.dragging
    }
  }, [persistenceKey, runMomentum, stopMomentum])

  const scrollClassName = cn(
    'no-scrollbar w-full max-w-full min-w-0 overflow-x-auto overflow-y-hidden overscroll-x-contain',
    'flex touch-pan-x flex-nowrap',
    '[&[data-dragging=true]]:cursor-grabbing [&[data-dragging=true]]:select-none'
  )

  return { scrollRef, scrollClassName }
}
