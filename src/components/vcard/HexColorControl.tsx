'use client'

import { canonicalCssColor, colorToHex, colorWithAlpha, readCssColor } from '@/lib/theme/sectionStyleDefaults'
import { useEffect, useRef, useState } from 'react'

/**
 * Keeps the hex field, the native swatch, and the saved color in sync.
 * The native input always receives #rrggbb so the picker stays clickable.
 * A finished color is published immediately; a half-typed hex waits until blur.
 */
export function useLiveCssColor(value: string | undefined, onChange?: (next: string) => void) {
  const fallback = value?.trim() || '#000000'
  const [text, setText] = useState(fallback)
  const [committed, setCommitted] = useState(fallback)
  const committedRef = useRef(fallback)
  const dirtyRef = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const incoming = value?.trim() || '#000000'
    if (dirtyRef.current) return
    committedRef.current = incoming
    setCommitted(incoming)
    setText(incoming)
  }, [value])

  const publish = (next: string, display?: string) => {
    dirtyRef.current = false
    setText(display ?? next)
    if (next.toLowerCase() === committedRef.current.trim().toLowerCase()) return
    committedRef.current = next
    setCommitted(next)
    onChangeRef.current?.(next)
  }

  const onTextChange = (raw: string) => {
    setText(raw)
    const next = canonicalCssColor(raw)
    if (!next) {
      dirtyRef.current = true
      return
    }
    publish(next, raw)
  }

  const onPicker = (hex: string) => {
    const current = canonicalCssColor(text, true)
    const alpha = current ? (readCssColor(current)?.a ?? 1) : 1
    const next = alpha < 0.995 ? colorWithAlpha(hex, alpha) : colorToHex(hex)
    publish(next)
  }

  const onBlur = () => {
    const next = canonicalCssColor(text, true)
    if (!next) {
      dirtyRef.current = false
      setText(committedRef.current)
      return
    }
    publish(next)
  }

  const exact = canonicalCssColor(text)
  const swatch = colorToHex(exact || committed || '#000000')

  return { text, swatch, onTextChange, onPicker, onBlur }
}

/** Visible color circle. The input itself is the hit target, always a valid #rrggbb. */
export function ColorSwatchInput({
  label,
  swatch,
  onChange,
  overlay = false,
}: {
  label: string
  swatch: string
  onChange: (hex: string) => void
  /** Cover a preview swatch (used when opacity must stay visible). */
  overlay?: boolean
}) {
  return (
    <input
      type="color"
      aria-label={`${label} color`}
      value={swatch}
      onChange={(event) => onChange(event.target.value)}
      className={overlay ? 'vbiz-color-swatch-input vbiz-color-swatch-input-overlay' : 'vbiz-color-swatch-input'}
    />
  )
}
