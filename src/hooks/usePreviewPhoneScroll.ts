'use client'

import { useCallback, useEffect, useRef } from 'react'

const DRAG_THRESHOLD_PX = 8
const MOMENTUM_FRICTION = 0.94
const MOMENTUM_MIN_VELOCITY = 0.35
const KEY_SCROLL_LINE = 48

const INTERACTIVE_SELECTOR = [
  'a',
  'button',
  'input',
  'textarea',
  'select',
  'audio',
  'video',
  'label',
  'summary',
  '[role="button"]',
  '[role="slider"]',
  '[contenteditable="true"]',
  '[contenteditable=""]',
].join(',')

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof Element)) return false
  return Boolean(target.closest(INTERACTIVE_SELECTOR))
}

function isInsideHorizontalScroller(target: EventTarget | null, stopAt: HTMLElement): boolean {
  if (!(target instanceof Element)) return false
  let node: Element | null = target
  while (node && node !== stopAt) {
    if (node.classList.contains('vbiz-floating-nav-scroll') || node.classList.contains('vbiz-v1-nav-scroll')) {
      return true
    }
    const { overflowX } = getComputedStyle(node)
    if ((overflowX === 'auto' || overflowX === 'scroll') && node.scrollWidth > node.clientWidth + 1) {
      return true
    }
    node = node.parentElement
  }
  return false
}

/**
 * Phone-glass scrolling for the live preview: native touch/pen, mouse drag with
 * inertia, wheel contained to the frame, keyboard when the region is focused.
 */
export function usePreviewPhoneScroll<T extends HTMLElement = HTMLDivElement>() {
  const scrollRef = useRef<T>(null)
  const isPressedRef = useRef(false)
  const isDraggingRef = useRef(false)
  const didDragRef = useRef(false)
  const pointerIdRef = useRef<number | null>(null)
  const startYRef = useRef(0)
  const scrollTopRef = useRef(0)
  const lastYRef = useRef(0)
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
    if (!el || prefersReducedMotion()) return

    stopMomentum()

    const step = () => {
      velocityRef.current *= MOMENTUM_FRICTION

      if (Math.abs(velocityRef.current) < MOMENTUM_MIN_VELOCITY) {
        momentumFrameRef.current = null
        return
      }

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      el.scrollTop = Math.min(maxScroll, Math.max(0, el.scrollTop - velocityRef.current))
      momentumFrameRef.current = requestAnimationFrame(step)
    }

    if (Math.abs(velocityRef.current) >= MOMENTUM_MIN_VELOCITY) {
      momentumFrameRef.current = requestAnimationFrame(step)
    }
  }, [stopMomentum])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return

    const clearPressState = () => {
      isPressedRef.current = false
      isDraggingRef.current = false
      pointerIdRef.current = null
      delete el.dataset.dragging
    }

    const onDocumentPointerMove = (e: PointerEvent) => {
      if (!isPressedRef.current || e.pointerId !== pointerIdRef.current) return

      const delta = e.pageY - startYRef.current

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
        velocityRef.current = ((e.pageY - lastYRef.current) / elapsed) * 16
      }
      lastYRef.current = e.pageY
      lastTimeRef.current = now

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      el.scrollTop = Math.min(maxScroll, Math.max(0, scrollTopRef.current - delta))
    }

    const onDocumentPointerUp = (e: PointerEvent) => {
      if (!isPressedRef.current || e.pointerId !== pointerIdRef.current) return

      document.removeEventListener('pointermove', onDocumentPointerMove)
      document.removeEventListener('pointerup', onDocumentPointerUp)
      document.removeEventListener('pointercancel', onDocumentPointerUp)

      const wasDragging = isDraggingRef.current
      clearPressState()

      if (wasDragging) {
        runMomentum()
      } else {
        didDragRef.current = false
      }
    }

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || e.pointerType !== 'mouse') return

      stopMomentum()

      if (isInteractiveTarget(e.target) || isInsideHorizontalScroller(e.target, el)) return

      isPressedRef.current = true
      isDraggingRef.current = false
      didDragRef.current = false
      pointerIdRef.current = e.pointerId
      startYRef.current = e.pageY
      scrollTopRef.current = el.scrollTop
      lastYRef.current = e.pageY
      lastTimeRef.current = performance.now()
      velocityRef.current = 0

      document.addEventListener('pointermove', onDocumentPointerMove, { passive: false })
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
      stopMomentum()
      e.stopPropagation()
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.target !== el) return
      if (e.altKey || e.ctrlKey || e.metaKey) return

      const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight)
      const page = Math.max(KEY_SCROLL_LINE, el.clientHeight * 0.9)
      let next: number | null = null

      switch (e.key) {
        case 'ArrowDown':
          next = el.scrollTop + KEY_SCROLL_LINE
          break
        case 'ArrowUp':
          next = el.scrollTop - KEY_SCROLL_LINE
          break
        case 'PageDown':
          next = el.scrollTop + page
          break
        case ' ':
          next = el.scrollTop + (e.shiftKey ? -page : page)
          break
        case 'PageUp':
          next = el.scrollTop - page
          break
        case 'Home':
          next = 0
          break
        case 'End':
          next = maxScroll
          break
        default:
          return
      }

      e.preventDefault()
      stopMomentum()
      el.scrollTop = Math.min(maxScroll, Math.max(0, next))
    }

    el.addEventListener('pointerdown', onPointerDown, { capture: true })
    el.addEventListener('click', onClickCapture, true)
    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('keydown', onKeyDown)

    return () => {
      stopMomentum()
      document.removeEventListener('pointermove', onDocumentPointerMove)
      document.removeEventListener('pointerup', onDocumentPointerUp)
      document.removeEventListener('pointercancel', onDocumentPointerUp)
      el.removeEventListener('pointerdown', onPointerDown, { capture: true })
      el.removeEventListener('click', onClickCapture, true)
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('keydown', onKeyDown)
      delete el.dataset.dragging
    }
  }, [runMomentum, stopMomentum])

  return { scrollRef }
}
