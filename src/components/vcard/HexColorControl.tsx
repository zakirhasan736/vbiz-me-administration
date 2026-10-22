'use client'

import { canonicalCssColor, colorToHex, colorWithAlpha, readCssColor } from '@/lib/theme/sectionStyleDefaults'
import { useEffect, useRef, useState, type ClipboardEvent } from 'react'

/**
 * Pull a usable CSS color out of clipboard / typed text.
 * Accepts bare hex, #hex, rgb()/rgba(), and colors embedded in longer paste strings.
 */
export function extractCssColor(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  const direct = canonicalCssColor(trimmed, true)
  if (direct) return direct

  const hashMatch = trimmed.match(/#([0-9a-f]{3,8})\b/i)
  if (hashMatch) {
    const fromHash = canonicalCssColor(hashMatch[0], true)
    if (fromHash) return fromHash
  }

  const bareMatch = trimmed.match(/(?:^|[^0-9a-f])([0-9a-f]{6}|[0-9a-f]{8})(?:[^0-9a-f]|$)/i)
  if (bareMatch?.[1]) {
    const fromBare = canonicalCssColor(bareMatch[1], true)
    if (fromBare) return fromBare
  }

  const rgbMatch = trimmed.match(/rgba?\(\s*[\d.]+[\s,/%]+[\d.]+[\s,/%]+[\d.]+(?:[\s,/%]+[\d.]+%?)?\s*\)/i)
  if (rgbMatch) {
    const fromRgb = canonicalCssColor(rgbMatch[0], true)
    if (fromRgb) return fromRgb
  }

  return null
}

function isCompleteHexInput(raw: string): boolean {
  const trimmed = raw.trim()
  const body = trimmed.startsWith('#') ? trimmed.slice(1) : trimmed
  return /^[0-9a-f]{6}$/i.test(body) || /^[0-9a-f]{8}$/i.test(body)
}

/**
 * Keeps the hex field, the native swatch, and the saved color in sync.
 * The native input always receives #rrggbb so the picker stays clickable.
 * A finished color is published immediately; a half-typed hex waits until blur.
 * Pending publishes stay "dirty" until the parent `value` catches up so the first
 * paste into a Template-default field is not wiped by a stale prop sync.
 */
export function useLiveCssColor(value: string | undefined, onChange?: (next: string) => void) {
  const fallback = value?.trim() || '#000000'
  const [text, setText] = useState(fallback)
  const [committed, setCommitted] = useState(fallback)
  const committedRef = useRef(fallback)
  const dirtyRef = useRef(false)
  const pendingPublishRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  useEffect(() => {
    const incoming = value?.trim() || '#000000'
    const pending = pendingPublishRef.current
    if (pending) {
      if (incoming.toLowerCase() === pending.toLowerCase()) {
        pendingPublishRef.current = null
        dirtyRef.current = false
        committedRef.current = incoming
        setCommitted(incoming)
        setText(incoming)
      }
      // Parent has not adopted the paste yet — keep the typed/pasted text.
      return
    }
    if (dirtyRef.current) return
    committedRef.current = incoming
    setCommitted(incoming)
    setText(incoming)
  }, [value])

  const publish = (next: string, display?: string) => {
    const normalized = next.trim()
    if (!normalized) return
    setText(display ?? normalized)

    const sameAsCommitted = normalized.toLowerCase() === committedRef.current.trim().toLowerCase()
    committedRef.current = normalized
    setCommitted(normalized)

    if (sameAsCommitted) {
      // Same as the displayed Template default — still write once so the field
      // stores an explicit override (public chrome only reads saved colors).
      pendingPublishRef.current = null
      dirtyRef.current = false
      onChangeRef.current?.(normalized)
      return
    }

    // Hold dirty until parent `value` matches, so a stale default prop cannot
    // wipe the first paste before React commits the override.
    pendingPublishRef.current = normalized
    dirtyRef.current = true
    onChangeRef.current?.(normalized)
  }

  const onTextChange = (raw: string) => {
    setText(raw)
    dirtyRef.current = true
    // Commit finished 6/8-digit hex while typing or after a replace-paste.
    // 3-digit hex waits for blur so `#fff` can grow into `#ffffff`.
    const next = isCompleteHexInput(raw) ? canonicalCssColor(raw, true) : canonicalCssColor(raw)
    if (!next) return
    publish(next, raw)
  }

  const onPaste = (event: ClipboardEvent<HTMLInputElement>) => {
    const raw = event.clipboardData.getData('text')
    const next = extractCssColor(raw)
    if (!next) return
    event.preventDefault()
    publish(next)
  }

  const onPicker = (hex: string) => {
    const current = canonicalCssColor(text, true)
    const alpha = current ? (readCssColor(current)?.a ?? 1) : 1
    const next = alpha < 0.995 ? colorWithAlpha(hex, alpha) : colorToHex(hex)
    publish(next)
  }

  const onBlur = () => {
    const next = extractCssColor(text) || canonicalCssColor(text, true)
    if (!next) {
      pendingPublishRef.current = null
      dirtyRef.current = false
      setText(committedRef.current)
      return
    }
    publish(next)
  }

  const exact = canonicalCssColor(text)
  const swatch = colorToHex(exact || committed || '#000000')

  return { text, swatch, onTextChange, onPaste, onPicker, onBlur }
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
