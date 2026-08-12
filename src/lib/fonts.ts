export type PresetFontId = 'inter' | 'outfit' | 'mono' | 'serif' | 'poppins' | 'roboto'

export type PresetFontOption = {
  id: PresetFontId
  name: string
  desc: string
  /** Family name used with fonts.googleapis.com/css2 */
  googleFamily: string
  stack: string
}

export const PRESET_FONTS: Record<PresetFontId, PresetFontOption> = {
  inter: {
    id: 'inter',
    name: 'Inter',
    desc: 'Clean, versatile, highly legible UI standard.',
    googleFamily: 'Inter',
    stack: "'Inter', ui-sans-serif, system-ui, sans-serif",
  },
  outfit: {
    id: 'outfit',
    name: 'Outfit',
    desc: 'Modern, geometric, bold appearance.',
    googleFamily: 'Outfit',
    stack: "'Outfit', ui-sans-serif, system-ui, sans-serif",
  },
  mono: {
    id: 'mono',
    name: 'JetBrains',
    desc: 'Technical, crisp, code-like aesthetic.',
    googleFamily: 'JetBrains Mono',
    stack: "'JetBrains Mono', ui-monospace, monospace",
  },
  serif: {
    id: 'serif',
    name: 'Playfair',
    desc: 'Elegant, classic, editorial feel.',
    googleFamily: 'Playfair Display',
    stack: "'Playfair Display', ui-serif, Georgia, serif",
  },
  poppins: {
    id: 'poppins',
    name: 'Poppins',
    desc: 'Friendly geometric sans with soft curves.',
    googleFamily: 'Poppins',
    stack: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  },
  roboto: {
    id: 'roboto',
    name: 'Roboto',
    desc: 'Neutral, widely used Material Design sans.',
    googleFamily: 'Roboto',
    stack: "'Roboto', ui-sans-serif, system-ui, sans-serif",
  },
}

export const PRESET_FONT_OPTIONS: PresetFontOption[] = [
  PRESET_FONTS.inter,
  PRESET_FONTS.outfit,
  PRESET_FONTS.mono,
  PRESET_FONTS.serif,
  PRESET_FONTS.poppins,
  PRESET_FONTS.roboto,
]

export function isPresetFontFamily(id: string | null | undefined): id is PresetFontId {
  return Boolean(id && id in PRESET_FONTS)
}

function sanitizeFamilyName(family: string): string {
  return family.replace(/['"]/g, '').trim()
}

/** CSS font-family stack for a preset id or Google family name. */
export function fontFamilyToStack(id: string | null | undefined): string {
  if (!id) return PRESET_FONTS.inter.stack
  if (isPresetFontFamily(id)) return PRESET_FONTS[id].stack
  const safe = sanitizeFamilyName(id)
  if (!safe) return PRESET_FONTS.inter.stack
  return `'${safe}', ui-sans-serif, system-ui, sans-serif`
}

/** Google Fonts family to load for a stored theme.fontFamily value. */
export function resolveGoogleFontFamily(fontId: string | null | undefined): string | null {
  if (!fontId?.trim()) return PRESET_FONTS.inter.googleFamily
  if (isPresetFontFamily(fontId)) return PRESET_FONTS[fontId].googleFamily
  const safe = sanitizeFamilyName(fontId)
  return safe || null
}

/** CSS2 stylesheet URL for a Google Fonts family (regular + medium + bold). */
export function googleFontsCssHref(family: string): string {
  const safe = sanitizeFamilyName(family)
  const param = safe.replace(/\s+/g, '+')
  return `https://fonts.googleapis.com/css2?family=${param}:wght@300;400;500;600;700&display=swap`
}

/** Display label for UI cards. */
export function fontFamilyDisplayName(fontId: string): string {
  if (isPresetFontFamily(fontId)) return PRESET_FONTS[fontId].name
  return sanitizeFamilyName(fontId) || 'Custom'
}
