'use client'

import { ModalPortal } from '@/components/ModalPortal'
import styles from '@/components/color/CustomColorPicker.module.css'
import {
  PRESET_COLORS,
  classicSwatchGrid,
  formatHsl,
  formatHsv,
  hexToHsv,
  hexToRgb,
  hsvToHex,
  parseHexColor,
  parseRgbChannel,
  rgbToHex,
  rgbToHsl,
  type Hsv,
} from '@/lib/color/colorSpace'
import { placeColorPopover, type PopoverBox } from '@/lib/color/placeColorPopover'
import { readRecentColors, rememberRecentColor } from '@/lib/color/recentColors'
import { cn } from '@/utils/cn'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { HsvColorPicker } from 'react-colorful'

/**
 * Browser notes (do not treat untested engines as certified):
 * - EyeDropper exists in Chromium secure contexts (Chrome, Edge, and some Android Chromium builds).
 *   Safari, Firefox, and iOS have no EyeDropper; the button is omitted and selection still works.
 * - react-colorful injects one `.react-colorful*` stylesheet. Those names do not match app styles.
 * - Inputs are 16px under 640px so iOS Safari does not zoom the page on focus.
 * - `env(safe-area-inset-*)` is progressive. The 12px padding remains when `env()` is ignored.
 * - Hue and saturation dragging uses react-colorful pointer events (mouse, touch, pen) plus its arrow keys.
 * - Automated checks on this Windows machine: Chromium, Firefox, and Playwright WebKit
 *   at 320–1920px, plus unit conversion tests. Physical Safari, iOS, iPadOS, Android,
 *   and Samsung Internet were not run here.
 */

type EyeDropperWindow = Window & {
  EyeDropper?: new () => { open: () => Promise<{ sRGBHex: string }> }
}

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

const SWATCHES = classicSwatchGrid()

function eyeDropperAvailable(): boolean {
  if (typeof window === 'undefined') return false
  const candidate = window as EyeDropperWindow
  return typeof candidate.EyeDropper === 'function' && window.isSecureContext !== false
}

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
  const [box, setBox] = useState<PopoverBox | null>(null)
  const [hexDraft, setHexDraft] = useState(selected)
  const [rgbText, setRgbText] = useState(() => {
    const rgb = hexToRgb(selected) || { r: 0, g: 0, b: 0 }
    return { r: String(rgb.r), g: String(rgb.g), b: String(rgb.b) }
  })
  const [recent, setRecent] = useState<string[]>([])
  const [dropper, setDropper] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const hexRef = useRef<HTMLInputElement>(null)
  const hexFocused = useRef(false)
  const rgbFocused = useRef(false)
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const publish = (nextHsv: Hsv, remember: boolean) => {
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
    if (remember) setRecent(rememberRecentColor(hex))
  }

  useEffect(() => {
    if (!controlled) return
    const next = parseHexColor(value || '')
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
  }, [controlled, value])

  const measure = () => {
    const triggerNode = triggerRef.current
    if (!triggerNode) return
    const rect = triggerNode.getBoundingClientRect()
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
        { width: window.innerWidth, height: window.innerHeight }
      )
    )
  }

  useEffect(() => {
    if (!open) return
    measure()
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.stopPropagation()
      setOpen(false)
    }
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('resize', measure)
    window.addEventListener('scroll', measure, true)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('resize', measure)
      window.removeEventListener('scroll', measure, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const frame = window.requestAnimationFrame(() => hexRef.current?.focus())
    return () => window.cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open || box?.placement !== 'sheet') return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open, box?.placement])

  const closeAndRestoreFocus = () => {
    setOpen(false)
    triggerRef.current?.focus()
  }

  const rgb = hexToRgb(hsvToHex(hsv)) || { r: 0, g: 0, b: 0 }
  const hsl = rgbToHsl(rgb)
  const preview = hsvToHex(hsv)
  const swatchMatch = preview.toLowerCase()

  const applyHexDraft = (raw: string) => {
    const next = parseHexColor(raw)
    if (!next) return
    const parsed = hexToHsv(next)
    if (!parsed) return
    publish({ ...parsed, h: parsed.s < 1 ? hsvRef.current.h : parsed.h }, true)
  }

  const applyRgbDraft = (channel: 'r' | 'g' | 'b', raw: string) => {
    setRgbText((current) => ({ ...current, [channel]: raw }))
    const nextChannel = parseRgbChannel(raw)
    if (nextChannel === null) return
    const base = hexToRgb(hsvToHex(hsvRef.current)) || { r: 0, g: 0, b: 0 }
    const parsed = hexToHsv(rgbToHex({ ...base, [channel]: nextChannel }))
    if (!parsed) return
    publish({ ...parsed, h: parsed.s < 1 ? hsvRef.current.h : parsed.h }, false)
  }

  const commitRgb = () => {
    rgbFocused.current = false
    const base = hexToRgb(hsvToHex(hsvRef.current)) || { r: 0, g: 0, b: 0 }
    setRgbText({ r: String(base.r), g: String(base.g), b: String(base.b) })
    setRecent(rememberRecentColor(hsvToHex(hsvRef.current)))
  }

  const pickScreen = async () => {
    const Ctor = (window as EyeDropperWindow).EyeDropper
    if (!Ctor) return
    try {
      const result = await new Ctor().open()
      const next = parseHexColor(result.sRGBHex)
      const parsed = next ? hexToHsv(next) : null
      if (parsed) publish(parsed, true)
    } catch {
      // User cancel and permission denial leave the current color in place.
    }
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
          setDropper(eyeDropperAvailable())
          setRecent(readRecentColors())
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
            <div className={styles.grid} role="listbox" aria-label="Color swatches">
              {SWATCHES.map((hex, index) => (
                <button
                  key={`${hex}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={hex === swatchMatch}
                  aria-label={hex}
                  className={cn(styles.swatch, hex === swatchMatch && styles.swatchActive)}
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    const parsed = hexToHsv(hex)
                    if (parsed) publish(parsed, true)
                  }}
                />
              ))}
            </div>
            <div className={styles.engine}>
              <HsvColorPicker
                color={hsv}
                onChange={(next: Hsv) => publish(next, false)}
                onChangeEnd={() => setRecent(rememberRecentColor(hsvToHex(hsvRef.current)))}
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
              {dropper ? (
                <button type="button" className={styles.dropper} onClick={() => void pickScreen()}>
                  Pick
                </button>
              ) : null}
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
            <p className={styles.sectionLabel}>Presets</p>
            <div className={styles.chips} role="listbox" aria-label="Preset colors">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  role="option"
                  aria-selected={hex === swatchMatch}
                  aria-label={`Preset ${hex}`}
                  className={cn(styles.swatch, hex === swatchMatch && styles.swatchActive)}
                  style={{ backgroundColor: hex }}
                  onClick={() => {
                    const parsed = hexToHsv(hex)
                    if (parsed) publish(parsed, true)
                  }}
                />
              ))}
            </div>
            {recent.length ? (
              <>
                <p className={styles.sectionLabel}>Recent</p>
                <div className={styles.chips} role="listbox" aria-label="Recent colors">
                  {recent.map((hex) => (
                    <button
                      key={hex}
                      type="button"
                      role="option"
                      aria-selected={hex === swatchMatch}
                      aria-label={`Recent ${hex}`}
                      className={cn(styles.swatch, hex === swatchMatch && styles.swatchActive)}
                      style={{ backgroundColor: hex }}
                      onClick={() => {
                        const parsed = hexToHsv(hex)
                        if (parsed) publish(parsed, true)
                      }}
                    />
                  ))}
                </div>
              </>
            ) : null}
            <button type="button" className={styles.dropper} onClick={closeAndRestoreFocus}>
              Done
            </button>
          </div>
        </ModalPortal>
      ) : null}
    </>
  )
}
