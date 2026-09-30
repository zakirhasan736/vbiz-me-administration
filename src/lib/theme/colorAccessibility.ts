/**
 * Contrast + companion-color suggestions for smart theme pickers.
 * Ensures text/icons stay readable on card and banner surfaces.
 */

const HEX_RE = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i

export const CONTRAST_BODY_MIN = 4.5
export const CONTRAST_LARGE_MIN = 3

function expandHex(hex: string): string {
  let h = hex.replace('#', '').trim()
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (h.length === 8) h = h.slice(0, 6)
  return h.toLowerCase()
}

export function isHexColor(value: string): boolean {
  return HEX_RE.test(value.trim())
}

/** Relative luminance (WCAG) 0–1. */
export function hexLuminance(hex: string): number {
  if (!isHexColor(hex)) return 0
  const h = expandHex(hex)
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

export function contrastRatio(fg: string, bg: string): number {
  if (!isHexColor(fg) || !isHexColor(bg)) return 1
  const l1 = hexLuminance(fg)
  const l2 = hexLuminance(bg)
  const lighter = Math.max(l1, l2)
  const darker = Math.min(l1, l2)
  return (lighter + 0.05) / (darker + 0.05)
}

/** 0–100 score from WCAG contrast (4.5:1 ≈ 100 for body text). */
export function visibilityScore(fg: string, bg: string, minRatio = CONTRAST_BODY_MIN): number {
  const ratio = contrastRatio(fg, bg)
  return Math.max(0, Math.min(100, Math.round((ratio / minRatio) * 100)))
}

export function isReadable(fg: string, bg: string, minRatio = CONTRAST_BODY_MIN): boolean {
  return contrastRatio(fg, bg) >= minRatio
}

export function readableForeground(background: string, dark = '#0b0b0d', light = '#ffffff'): string {
  if (!isHexColor(background)) return light
  return hexLuminance(background) > 0.55 ? dark : light
}

/** Prefer preferredFg when it passes; otherwise black/white for the bg. */
export function ensureReadableText(bg: string, preferredFg?: string | null, minRatio = CONTRAST_BODY_MIN): string {
  const preferred = preferredFg?.trim()
  if (preferred && isHexColor(preferred) && isReadable(preferred, bg, minRatio)) {
    return preferred
  }
  return readableForeground(bg)
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

function hexToHsl(hex: string): { h: number; s: number; l: number } | null {
  if (!isHexColor(hex)) return null
  const h = expandHex(hex)
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return { h: 0, s: 0, l }
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let hue = 0
  if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) hue = ((b - r) / d + 2) / 6
  else hue = ((r - g) / d + 4) / 6
  return { h: hue * 360, s, l }
}

function hslToHex(h: number, s: number, l: number): string {
  const hh = ((h % 360) + 360) % 360
  const ss = clamp(s, 0, 1)
  const ll = clamp(l, 0, 1)
  const c = (1 - Math.abs(2 * ll - 1)) * ss
  const x = c * (1 - Math.abs(((hh / 60) % 2) - 1))
  const m = ll - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (hh < 60) {
    r = c
    g = x
  } else if (hh < 120) {
    r = x
    g = c
  } else if (hh < 180) {
    g = c
    b = x
  } else if (hh < 240) {
    g = x
    b = c
  } else if (hh < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }
  const to = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, '0')
  return `#${to(r)}${to(g)}${to(b)}`
}

export type ThemeModeHint = 'light' | 'dark'

/**
 * Suggest a secondary (navy/near-black contrast) that stays readable as text on primary fills
 * and as a surface companion for the mode.
 */
export function suggestSecondaryFromPrimary(primary: string, mode: ThemeModeHint = 'dark'): string {
  const hsl = hexToHsl(primary)
  if (!hsl) return mode === 'light' ? '#0f2c4d' : '#0f2c4d'
  // Cool navy shifted ~180° with low lightness for brand contrast on gold.
  const h = (hsl.h + 200) % 360
  const candidate = hslToHex(h, clamp(hsl.s * 0.55 + 0.25, 0.35, 0.7), mode === 'light' ? 0.18 : 0.12)
  // Must contrast with primary when used as fg on primary fill.
  if (isReadable(candidate, primary, CONTRAST_LARGE_MIN)) return candidate
  return readableForeground(primary)
}

/** Suggest accent: related gold/warm neighbor that still pops on page background. */
export function suggestAccentFromPrimary(primary: string, mode: ThemeModeHint = 'dark'): string {
  const hsl = hexToHsl(primary)
  if (!hsl) return primary
  const lightShift = mode === 'light' ? -0.08 : 0.06
  const candidate = hslToHex(hsl.h, clamp(hsl.s + 0.05, 0.4, 0.9), clamp(hsl.l + lightShift, 0.35, 0.72))
  return candidate
}

export type BrandSuggestion = {
  secondary: string
  accent: string
  /** Text that stays readable on primary fill. */
  onPrimary: string
  /** Text for page background. */
  onBackground: string
}

export function suggestBrandCompanions(primary: string, pageBackground: string, mode: ThemeModeHint): BrandSuggestion {
  const secondary = suggestSecondaryFromPrimary(primary, mode)
  const accent = suggestAccentFromPrimary(primary, mode)
  return {
    secondary,
    accent,
    onPrimary: ensureReadableText(primary, secondary, CONTRAST_LARGE_MIN),
    onBackground: ensureReadableText(pageBackground, undefined, CONTRAST_BODY_MIN),
  }
}

/** Fix a palette so text/muted/border stay readable on background/surface. */
export function ensureReadableColorSet(input: {
  background: string
  surface: string
  text?: string
  textMuted?: string
  primary: string
  secondary: string
  accent: string
}): { text: string; textMuted: string; border: string } {
  const text = ensureReadableText(input.background, input.text, CONTRAST_BODY_MIN)
  let textMuted = input.textMuted && isHexColor(input.textMuted) ? input.textMuted : text
  if (!isReadable(textMuted, input.background, 3)) {
    // Soften text toward mid-gray while keeping contrast.
    textMuted = hexLuminance(input.background) > 0.55 ? '#52525b' : '#a1a1aa'
    if (!isReadable(textMuted, input.background, 3)) {
      textMuted = ensureReadableText(input.background, textMuted, 3)
    }
  }
  const border =
    hexLuminance(input.background) > 0.55
      ? 'color-mix(in srgb, #0b0b0d 12%, transparent)'
      : 'color-mix(in srgb, #ffffff 14%, transparent)'
  return {
    text,
    textMuted,
    border: isHexColor(input.background) ? (hexLuminance(input.background) > 0.55 ? '#e4e4e7' : '#1e293b') : border,
  }
}
