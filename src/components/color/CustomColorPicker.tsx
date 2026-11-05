'use client'

import { ModalPortal } from '@/components/ModalPortal'
import styles from '@/components/color/CustomColorPicker.module.css'
import {
  formatHsl,
  formatHsv,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  macColorWellGrid,
  parseHexColor,
  parseRgbChannel,
  rgbToHex,
  rgbToHsl,
  type Hsv,
} from '@/lib/color/colorSpace'
import {
  COLOR_PANEL_HEIGHT,
  COLOR_PANEL_WIDTH,
  placeColorPopover,
  type PopoverBox,
} from '@/lib/color/placeColorPopover'
import { cn } from '@/utils/cn'
import { useEffect, useEffectEvent, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { HsvColorPicker } from 'react-colorful'

/**
 * Browser notes (do not treat untested engines as certified):
 * - react-colorful injects one `.react-colorful*` stylesheet. Those names do not match app styles.
 * - Inputs are 16px under 640px so iOS Safari does not zoom the page on focus.
 * - `env(safe-area-inset-*)` is progressive. The 12px padding remains when `env()` is ignored.
 * - Hue and saturation dragging uses react-colorful pointer events (mouse, touch, pen) plus its arrow keys.
 * - Automated checks on this Windows machine: Chromium, Firefox, and Playwright WebKit
 *   at 320–1920px, plus unit conversion tests. Physical Safari, iOS, iPadOS, Android,
 *   and Samsung Internet were not run here.
 */

export type CustomColorPickerProps = {
  label: string
  value?: string
  defaultValue?: string
  onChange?: (hex: string) => void
  /** overlay: transparent hit target over a parent swatch. bar: full-width trigger. */
  trigger?: 'swatch' | 'overlay' | 'bar'
  className?: string
  triggerClassName?: string
}

const SWATCHES = macColorWellGrid()
const SPECTRUM = SWATCHES.slice(0, 12)
const MATRIX = SWATCHES.slice(12)

function resolvedHex(value: string | undefined, fallback: string): string {
  return parseHexColor(value || '') || parseHexColor(fallback) || '#000000'
}

export function CustomColorPicker({
  label,
  value,
  defaultValue = '#000000',
  onChange,
  trigger = 'swatch',
  className,
  triggerClassName,
}: CustomColorPickerProps) {
  const reactId = useId()
  const panelId = `color-panel-${reactId}`
  const controlled = value !== undefined
  const [uncontrolled, setUncontrolled] = useState(() => resolvedHex(defaultValue, '#000000'))
  const selected = controlled ? resolvedHex(value, uncontrolled) : uncontrolled
  const [hsv, setHsv] = useState<Hsv>(() => hexToHsv(selected) || { h: 0, s: 0, v: 0 })
  const hsvRef = useRef(hsv)
  const [open, setOpen] = useState(false)
  const [details, setDetails] = useState(false)
  const [box, setBox] = useState<PopoverBox | null>(null)
  const [hexDraft, setHexDraft] = useState(selected)
  const [rgbText, setRgbText] = useState(() => {
    const rgb = hexToRgb(selected) || { r: 0, g: 0, b: 0 }
    return { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) }
  })
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hexRef = useRef<HTMLInputElement>(null)
  const hexFocused = useRef(false)
  const rgbFocused = useRef(false)
  const draggingRef = useRef(false)
  const pendingExternalRef = useRef<string | null>(null)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const applyExternalHex = (next: string) => {
    if (!next || next === hsvToHex(hsvRef.current)) return
    const parsed = hexToHsv(next)
    if (!parsed) return
    const nextHsv = { ...parsed, h: parsed.s < 1 ? hsvRef.current.h : parsed.h }
    hsvRef.current = nextHsv
    setHsv(nextHsv)
    if (!hexFocused.current) setHexDraft(next)
    if (!rgbFocused.current) {
      const rgb = hexToRgb(next)
      if (rgb) setRgbText({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) })
    }
  }

  const publish = (nextHsv: Hsv) => {
    const hex = hsvToHex(nextHsv)
    hsvRef.current = nextHsv
    setHsv(nextHsv)
    if (!hexFocused.current) setHexDraft(hex)
    if (!rgbFocused.current) {
      const rgb = hexToRgb(hex)
      if (rgb) setRgbText({ r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) })
    }
    if (!controlled) setUncontrolled(hex)
    onChangeRef.current?.(hex)
  }

  const endDrag = useEffectEvent(() => {
    if (!draggingRef.current) return
    draggingRef.current = false
    const pending = pendingExternalRef.current
    pendingExternalRef.current = null
    if (pending) applyExternalHex(pending)
  })

  useEffect(() => {
    if (!controlled) return
    const next = parseHexColor(value || '')
    if (!next) return
    if (draggingRef.current) {
      pendingExternalRef.current = next
      return
    }
    applyExternalHex(next)
  }, [controlled, value])

  const measure = useEffectEvent(() => {
    const triggerNode = triggerRef.current
    if (!triggerNode) return
    const rect = triggerNode.getBoundingClientRect()
    const panel = panelRef.current
    const wantsSheet = window.innerWidth < 640 || (window.innerHeight < 500 && window.innerWidth < 900)
    const width = details ? 292 : COLOR_PANEL_WIDTH
    if (panel && !wantsSheet) panel.style.width = `${width}px`
    const panelHeight = panel?.scrollHeight || (details ? 560 : COLOR_PANEL_HEIGHT)
    setBox(
      placeColorPopover(
        {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
          width: rect.width,
          height: rect.height,
        },
        { width: window.innerWidth, height: window.innerHeight },
        { width: details ? 292 : COLOR_PANEL_WIDTH, height: panelHeight }
      )
    )
  })

  useLayoutEffect(() => {
    if (!open) return
    measure()
  }, [open, details])

  useEffect(() => {
    if (!open) return
    const close = () => {
      setDetails(false)
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      close()
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close()
    }
    const onScroll = (event: Event) => {
      const target = event.target
      if (target instanceof Node && panelRef.current?.contains(target)) return
      measure()
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('pointerup', endDrag)
    window.addEventListener('pointercancel', endDrag)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', onScroll, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', endDrag)
      window.removeEventListener('pointercancel', endDrag)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', onScroll, true)
    }
  }, [open, details])

  useEffect(() => {
    if (!open || !details) return
    const frame = window.requestAnimationFrame(() => hexRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open, details])

  useEffect(() => {
    if (!open || box?.placement !== 'sheet') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open, box?.placement])

  const rgb = hexToRgb(hsvToHex(hsv)) || { r: 0, g: 0, b: 0 }
  const hsl = rgbToHsl(rgb)
  const preview = hsvToHex(hsv)
  const swatchMatch = preview.toLowerCase()

  const applyHexDraft = (raw: string) => {
    const next = parseHexColor(raw)
    if (!next) return
    const parsed = hexToHsv(next)
    if (!parsed) return
    publish({ ...parsed, h: parsed.s < 1 ? hsvRef.current.h : parsed.h })
  }

  const applyRgbDraft = (channel: 'r' | 'g' | 'b', raw: string) => {
    setRgbText((current) => ({ ...current, [channel]: raw }))
    const nextChannel = parseRgbChannel(raw)
    if (nextChannel === null) return
    const base = hexToRgb(hsvToHex(hsvRef.current)) || { r: 0, g: 0, b: 0 }
    const parsed = hexToHsv(rgbToHex({ ...base, [channel]: nextChannel }))
    if (!parsed) return
    publish({ ...parsed, h: parsed.s < 1 ? hsvRef.current.h : parsed.h })
  }

  const commitRgb = () => {
    rgbFocused.current = false
    const base = hexToRgb(hsvToHex(hsvRef.current)) || { r: 0, g: 0, b: 0 }
    setRgbText({ r: String(base.r), g: String(base.g), b: String(base.b) })
  }

  const floatingStyle = useMemo(() => {
    if (!box || box.placement === 'sheet') return undefined
    return { top: box.top, left: box.left, width: box.width, maxHeight: box.maxHeight }
  }, [box])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={cn(
          styles.trigger,
          trigger === 'overlay' && styles.overlayTrigger,
          trigger === 'bar' && styles.barTrigger,
          triggerClassName,
          className
        )}
        style={trigger === 'overlay' ? undefined : { backgroundColor: preview }}
        aria-label={`${label} color`}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => {
          setDetails(false)
          setOpen((current) => !current)
        }}
      />
      {open ? (
        <ModalPortal>
          <div
            ref={panelRef}
            id={panelId}
            role="dialog"
            aria-modal={box?.placement === 'sheet'}
            aria-label={`${label} color`}
            data-color-picker-panel
            data-placement={box?.placement || 'below'}
            className={cn(styles.panel, box?.placement === 'sheet' ? styles.sheet : styles.floating)}
            style={floatingStyle}
          >
            {box && box.placement !== 'sheet' ? (
              <span
                className={cn(styles.arrow, box.placement === 'above' && styles.arrowAbove)}
                style={{ left: box.arrow }}
                aria-hidden
              />
            ) : null}
            <div className={styles.spectrum} role="listbox" aria-label="Color swatches">
              {SPECTRUM.map((hex, index) => (
                <button
                  key={`spectrum-${hex}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={hex === swatchMatch}
                  aria-label={hex}
                  className={cn(styles.swatch, hex === swatchMatch && styles.swatchActive)}
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    draggingRef.current = false
                    const parsed = hexToHsv(hex)
                    if (parsed) publish(parsed)
                  }}
                />
              ))}
            </div>
            <div className={styles.matrix} role="listbox" aria-label="Color shades">
              {MATRIX.map((hex, index) => (
                <button
                  key={`shade-${hex}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={hex === swatchMatch}
                  aria-label={hex}
                  className={cn(styles.swatch, hex === swatchMatch && styles.swatchActive)}
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    draggingRef.current = false
                    const parsed = hexToHsv(hex)
                    if (parsed) publish(parsed)
                  }}
                />
              ))}
            </div>
            <button
              type="button"
              className={styles.showColors}
              aria-expanded={details}
              onClick={() => setDetails((current) => !current)}
            >
              {details ? 'Hide Colors' : 'Show Colors...'}
            </button>
            {details ? (
              <div className={styles.details}>
                <div
                  className={styles.engine}
                  onPointerDown={() => {
                    draggingRef.current = true
                  }}
                >
                  <HsvColorPicker
                    color={hsv}
                    onChange={(next: Hsv) => {
                      draggingRef.current = true
                      publish(next)
                    }}
                  />
                </div>
                <p className={styles.readout}>
                  {formatHsl(hsl)} · {formatHsv(hsv)}
                </p>
                <div className={styles.controls}>
                  <span className={styles.preview} style={{ backgroundColor: preview }} aria-hidden />
                  <label className={styles.fieldLabel}>
                    Hex
                    <input
                      ref={hexRef}
                      className={styles.field}
                      aria-label={`${label} hex`}
                      value={hexDraft}
                      spellCheck={false}
                      autoCapitalize="off"
                      autoCorrect="off"
                      inputMode="text"
                      onFocus={() => {
                        hexFocused.current = true
                      }}
                      onBlur={() => {
                        hexFocused.current = false
                        const next = parseHexColor(hexDraft)
                        if (!next) {
                          setHexDraft(preview)
                          return
                        }
                        applyHexDraft(next)
                      }}
                      onChange={(event) => {
                        const raw = event.target.value
                        setHexDraft(raw)
                        if (parseHexColor(raw)) applyHexDraft(raw)
                      }}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.currentTarget.blur()
                        }
                      }}
                    />
                  </label>
                </div>
                <div className={styles.rgb}>
                  {(['r', 'g', 'b'] as const).map((channel) => (
                    <label key={channel} className={styles.fieldLabel}>
                      {channel}
                      <input
                        className={styles.field}
                        aria-label={`${label} ${channel === 'r' ? 'red' : channel === 'g' ? 'green' : 'blue'}`}
                        inputMode="numeric"
                        value={rgbText[channel]}
                        onFocus={() => {
                          rgbFocused.current = true
                        }}
                        onBlur={commitRgb}
                        onChange={(event) => applyRgbDraft(channel, event.target.value)}
                      />
                    </label>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </ModalPortal>
      ) : null}
    </>
  )
}
