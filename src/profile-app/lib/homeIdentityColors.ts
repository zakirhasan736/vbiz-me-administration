import type { ThemeMode } from '@/lib/theme/cardThemeContract'
import { resolveFieldModeColors } from '@/lib/vcardDisplaySettings'
import type { DisplayFieldConfig } from '@/types/vcardDisplaySettings'
import type { CSSProperties } from 'react'

type IdentityColors = {
  nameStyle: CSSProperties
  professionStyle: CSSProperties
  /** Tailwind-friendly class for name when styling alongside inline color. */
  nameClassName: string
  /** Tailwind-friendly class for designation when styling alongside inline color. */
  professionClassName: string
}

/**
 * Home-screen owner name + designation colors over video/wallpaper.
 * Light: primary brand color for both lines (readable brand accent on media).
 * Dark: white name + accent designation (existing home treatment).
 * Card Settings light/dark field colors win when set.
 */
export function resolveHomeIdentityColors(options: {
  mode: ThemeMode
  nameField?: DisplayFieldConfig
  professionField?: DisplayFieldConfig
  designationField?: DisplayFieldConfig
  /** Legacy header color from Home settings (applies to name). */
  headerTextColor?: string
}): IdentityColors {
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const header = options.headerTextColor?.trim() || ''

  const nameResolved = resolveFieldModeColors(options.nameField, mode, { preferText: true })
  const professionFromProfession = resolveFieldModeColors(options.professionField, mode, { preferText: true })
  const professionFromDesignation = resolveFieldModeColors(options.designationField, mode, { preferText: true })
  const professionResolved =
    professionFromProfession.fg || professionFromProfession.fill ? professionFromProfession : professionFromDesignation

  const nameStyle: CSSProperties = {}
  if (header) nameStyle.color = header
  else if (nameResolved.fg) nameStyle.color = nameResolved.fg
  else nameStyle.color = mode === 'light' ? 'var(--vbiz-primary)' : '#ffffff'
  if (nameResolved.fill) nameStyle.backgroundColor = nameResolved.fill

  const professionStyle: CSSProperties = {}
  if (professionResolved.fg) {
    professionStyle.color = professionResolved.fg
    professionStyle.backgroundImage = 'none'
    professionStyle.WebkitTextFillColor = 'unset'
  } else {
    professionStyle.color = mode === 'light' ? 'var(--vbiz-primary)' : 'var(--vbiz-accent)'
  }
  if (professionResolved.fill) professionStyle.backgroundColor = professionResolved.fill

  return {
    nameStyle,
    professionStyle,
    nameClassName:
      mode === 'light'
        ? 'text-[color:var(--vbiz-primary)] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]'
        : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
    professionClassName:
      mode === 'light'
        ? 'text-[color:var(--vbiz-primary)] drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]'
        : 'text-[color:var(--vbiz-accent)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
  }
}
