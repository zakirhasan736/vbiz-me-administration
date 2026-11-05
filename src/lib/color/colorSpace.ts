export type Rgb = { r: number; g: number; b: number }
export type Hsl = { h: number; s: number; l: number }
export type Hsv = { h: number; s: number; v: number }

const BYTE = (n: number) => Math.max(0, Math.min(255, Math.round(n)))
const UNIT = (n: number, max: number) => Math.max(0, Math.min(max, n))

function hexByte(n: number): string {
  return BYTE(n).toString(16).padStart(2, '0')
}

export function rgbToHex(rgb: Rgb): string {
  return `#${hexByte(rgb.r)}${hexByte(rgb.g)}${hexByte(rgb.b)}`
}

/** Finished #rgb or #rrggbb only. Partial typing returns null and must not be saved. */
export function parseHexColor(raw: string): string | null {
  const body = raw.trim().replace(/^#/, '')
  if (!/^[0-9a-f]{3}$|^[0-9a-f]{6}$/i.test(body)) return null
  const full =
    body.length === 3
      ? body
          .split('')
          .map((char) => char + char)
          .join('')
      : body
  return `#${full.toLowerCase()}`
}

export function hexToRgb(hex: string): Rgb | null {
  const parsed = parseHexColor(hex)
  if (!parsed) return null
  return {
    r: parseInt(parsed.slice(1, 3), 16),
    g: parseInt(parsed.slice(3, 5), 16),
    b: parseInt(parsed.slice(5, 7), 16),
  }
}

export function rgbToHsv(rgb: Rgb): Hsv {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const delta = max - min
  let h = 0
  if (delta !== 0) {
    if (max === r) h = ((g - b) / delta) % 6
    else if (max === g) h = (b - r) / delta + 2
    else h = (r - g) / delta + 4
    h *= 60
    if (h < 0) h += 360
  }
  return {
    h,
    s: max === 0 ? 0 : (delta / max) * 100,
    v: max * 100,
  }
}

export function hsvToRgb(hsv: Hsv): Rgb {
  const h = ((hsv.h % 360) + 360) % 360
  const s = UNIT(hsv.s, 100) / 100
  const v = UNIT(hsv.v, 100) / 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: BYTE((r + m) * 255), g: BYTE((g + m) * 255), b: BYTE((b + m) * 255) }
}

export function hsvToHex(hsv: Hsv): string {
  return rgbToHex(hsvToRgb(hsv))
}

export function hexToHsv(hex: string): Hsv | null {
  const rgb = hexToRgb(hex)
  return rgb ? rgbToHsv(rgb) : null
}

export function rgbToHsl(rgb: Rgb): Hsl {
  const r = rgb.r / 255
  const g = rgb.g / 255
  const b = rgb.b / 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  const delta = max - min
  if (delta === 0) return { h: 0, s: 0, l: l * 100 }
  const s = l > 0.5 ? delta / (2 - max - min) : delta / (max + min)
  let h = 0
  if (max === r) h = ((g - b) / delta) % 6
  else if (max === g) h = (b - r) / delta + 2
  else h = (r - g) / delta + 4
  h *= 60
  if (h < 0) h += 360
  return { h, s: s * 100, l: l * 100 }
}

export function hslToRgb(hsl: Hsl): Rgb {
  const h = ((hsl.h % 360) + 360) % 360
  const s = UNIT(hsl.s, 100) / 100
  const l = UNIT(hsl.l, 100) / 100
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0
  let g = 0
  let b = 0
  if (h < 60) [r, g, b] = [c, x, 0]
  else if (h < 120) [r, g, b] = [x, c, 0]
  else if (h < 180) [r, g, b] = [0, c, x]
  else if (h < 240) [r, g, b] = [0, x, c]
  else if (h < 300) [r, g, b] = [x, 0, c]
  else [r, g, b] = [c, 0, x]
  return { r: BYTE((r + m) * 255), g: BYTE((g + m) * 255), b: BYTE((b + m) * 255) }
}

/** Accepts a finished channel. Empty or out-of-range text returns null. */
export function parseRgbChannel(raw: string): number | null {
  const trimmed = raw.trim()
  if (!/^\d{1,3}$/.test(trimmed)) return null
  const value = Number(trimmed)
  if (!Number.isInteger(value) || value > 255) return null
  return value
}

export function formatHsl(hsl: Hsl): string {
  return `hsl(${Math.round(hsl.h)} ${Math.round(hsl.s)}% ${Math.round(hsl.l)}%)`
}

export function formatHsv(hsv: Hsv): string {
  return `hsv(${Math.round(hsv.h)} ${Math.round(hsv.s)}% ${Math.round(hsv.v)}%)`
}

/** Classic macOS-style spectrum: one gray row, then hue columns across shade rows. */
export function classicSwatchGrid(): string[] {
  const cells: string[] = []
  for (let index = 0; index < 10; index += 1) {
    const channel = Math.round(255 * (1 - index / 9))
    cells.push(rgbToHex({ r: channel, g: channel, b: channel }))
  }
  const hues = [0, 24, 48, 72, 120, 160, 190, 220, 260, 300]
  const rows = [
    { s: 100, v: 100 },
    { s: 75, v: 95 },
    { s: 100, v: 75 },
    { s: 55, v: 85 },
    { s: 100, v: 50 },
  ]
  for (const row of rows) {
    for (const h of hues) cells.push(hsvToHex({ h, s: row.s, v: row.v }))
  }
  return cells
}

export const PRESET_COLORS = [
  '#000000',
  '#ffffff',
  '#ff3b30',
  '#ff9500',
  '#ffcc00',
  '#34c759',
  '#5ac8fa',
  '#007aff',
  '#5856d6',
  '#af52de',
  '#ff2d55',
  '#8e8e93',
] as const
