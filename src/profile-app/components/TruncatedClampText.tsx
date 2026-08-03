'use client'

import { stripHtml } from '@/lib/api/calendar/resolveCalendarItemUrl'
import { ArrowUpRight } from 'lucide-react'
import { useState, type CSSProperties, type MouseEvent, type ReactNode } from 'react'

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
  /** Minimum plain length before showing toggle (default 200). */
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

/** Shared line-clamp with read more / read less (or external read-more handler). */
export function TruncatedClampText({
  plain,
  html,
  className = '',
  textClassName = 'text-sm leading-relaxed font-medium text-zinc-600 dark:text-zinc-400',
  accentColor = '#eab308',
  onReadMore,
  readMoreIcon,
  readMoreLabel = 'Read more',
  readLessLabel = 'Read less',
  seeMoreLabel = 'See more',
  seeLessLabel = 'See less',
  minLength = 200,
  maxLines = 4,
}: TruncatedClampTextProps) {
  const [expanded, setExpanded] = useState(false)
  const hasHtml = Boolean(html?.trim())
  const plainText = plain?.trim() ?? ''
  if (!hasHtml && !plainText) return null

  const bodyForMeasure = hasHtml ? stripHtml(html!) : plainText
  const isLong =
    bodyForMeasure.length > minLength || bodyForMeasure.split('\n').filter((line) => line.trim()).length > maxLines
  const showToggle = onReadMore ? Boolean(plainText || hasHtml) : isLong
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
          className={`prose prose-zinc dark:prose-invert mb-4 max-w-2xl ${textClassName}`}
          style={clampStyle}
          dangerouslySetInnerHTML={{ __html: html! }}
        />
      ) : (
        <p className={`mb-4 max-w-2xl whitespace-pre-wrap ${textClassName}`} style={clampStyle}>
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
