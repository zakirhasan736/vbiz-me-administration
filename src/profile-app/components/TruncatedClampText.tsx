'use client'

import { ArrowUpRight } from 'lucide-react'
import { useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type Ref } from 'react'

type TruncatedClampTextProps = {
  /** Plain text body (mutually exclusive with `html`). */
  plain?: string
  /** HTML body rendered via dangerouslySetInnerHTML. */
  html?: string
  className?: string
  textClassName?: string
  accentColor?: string
  /** When set, the toggle button calls this instead of expanding inline. */
  onReadMore?: (e: MouseEvent) => void
  readMoreIcon?: ReactNode
  readMoreLabel?: string
  readLessLabel?: string
  seeMoreLabel?: string
  seeLessLabel?: string
  /** Kept for call-site compatibility; toggle visibility uses real overflow. */
  minLength?: number
  /** Visible lines before clamping (default 4). */
  maxLines?: number
}

function lineClampStyle(maxLines: number, expanded: boolean): CSSProperties | undefined {
  if (expanded) return undefined
  return {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  }
}

function safeDetach(node: HTMLElement) {
  const parent = node.parentNode
  if (parent) parent.removeChild(node)
}

function measureNeedsClamp(el: HTMLElement, maxLines: number): boolean {
  const width = el.clientWidth
  const parent = el.parentElement
  if (width <= 0 || !parent || !parent.isConnected) return false

  const base = `position:absolute;visibility:hidden;pointer-events:none;height:auto;width:${width}px`
  let fullClone: HTMLElement | null = null
  let clampedClone: HTMLElement | null = null

  try {
    fullClone = el.cloneNode(true) as HTMLElement
    fullClone.style.cssText = `${base};display:block;max-height:none;-webkit-line-clamp:unset;overflow:visible`
    parent.appendChild(fullClone)
    const fullHeight = fullClone.scrollHeight
    safeDetach(fullClone)
    fullClone = null

    clampedClone = el.cloneNode(true) as HTMLElement
    clampedClone.style.cssText = `${base};display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:${maxLines};overflow:hidden`
    parent.appendChild(clampedClone)
    const clampedHeight = clampedClone.clientHeight
    safeDetach(clampedClone)
    clampedClone = null

    return fullHeight > clampedHeight + 1
  } catch {
    return false
  } finally {
    if (fullClone) safeDetach(fullClone)
    if (clampedClone) safeDetach(clampedClone)
  }
}

/** Shared line-clamp with read more / read less (or external read-more handler). */
export function TruncatedClampText({
  plain,
  html,
  className = '',
  textClassName = 'vbiz-description text-sm leading-relaxed font-medium',
  accentColor = '#eab308',
  onReadMore,
  readMoreIcon,
  readMoreLabel = 'Read more',
  readLessLabel = 'Read less',
  seeMoreLabel = 'See more',
  seeLessLabel = 'See less',
  maxLines = 4,
}: TruncatedClampTextProps) {
  const hasHtml = Boolean(html?.trim())
  const plainText = plain?.trim() ?? ''
  const hasContent = hasHtml || Boolean(plainText)
  const contentKey = `${maxLines}:${hasHtml ? html : plainText}`

  const [expanded, setExpanded] = useState(false)
  const [needsClamp, setNeedsClamp] = useState(false)
  const [seenContentKey, setSeenContentKey] = useState(contentKey)
  const contentRef = useRef<HTMLElement | null>(null)

  // Reset expansion when the body changes (adjust state during render — no effect).
  if (contentKey !== seenContentKey) {
    setSeenContentKey(contentKey)
    setExpanded(false)
  }

  useLayoutEffect(() => {
    const el = contentRef.current
    if (!el || !hasContent || onReadMore) return

    let frame = 0
    const measure = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const overflows = measureNeedsClamp(el, maxLines)
        setNeedsClamp(overflows)
        if (!overflows) setExpanded(false)
      })
    }

    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => {
      cancelAnimationFrame(frame)
      ro.disconnect()
    }
  }, [plain, html, maxLines, onReadMore, hasContent])

  if (!hasContent) return null

  const showToggle = onReadMore ? true : needsClamp
  const clampStyle = lineClampStyle(maxLines, expanded)

  const handleToggle = (e: MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (onReadMore) {
      onReadMore(e)
      return
    }
    setExpanded((prev) => !prev)
  }

  const toggleLabel = onReadMore
    ? readMoreLabel
    : expanded
      ? hasHtml
        ? readLessLabel
        : seeLessLabel
      : hasHtml
        ? readMoreLabel
        : seeMoreLabel

  return (
    <div className={className}>
      {hasHtml ? (
        <div
          ref={contentRef as Ref<HTMLDivElement>}
          className={`vcard-rich-html mb-4 max-w-2xl ${textClassName}`}
          style={clampStyle}
          dangerouslySetInnerHTML={{ __html: html! }}
        />
      ) : (
        <p
          ref={contentRef as Ref<HTMLParagraphElement>}
          className={`mb-4 max-w-2xl whitespace-pre-wrap ${textClassName}`}
          style={clampStyle}
        >
          {plainText}
        </p>
      )}
      {showToggle ? (
        <button
          type="button"
          onClick={handleToggle}
          className="mb-4 inline-flex items-center gap-1 text-sm font-bold transition-opacity hover:opacity-80"
          style={{ color: accentColor }}
        >
          {toggleLabel}
          {onReadMore && (readMoreIcon ?? <ArrowUpRight size={14} />)}
        </button>
      ) : null}
    </div>
  )
}
