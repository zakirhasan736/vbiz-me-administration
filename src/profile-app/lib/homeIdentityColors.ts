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

function fieldTextColor(config: DisplayFieldConfig | undefined, mode: ThemeMode): string | undefined {
  if (!config || config.visible === false) return undefined
  const resolved = resolveFieldModeColors(config, mode, { preferText: true })
  return resolved.fg?.trim() || undefined
}

/**
 * Global home heading / description defaults (every card):
 * - Dark: heading white, description primary
 * - Light: heading secondary, description primary
 * Uses the card’s own `--vbiz-primary` / `--vbiz-secondary` brand tokens.
 * Home Page → Heading/Description Color overrides win until Reset clears them.
 */
export function resolveHomeIdentityColors(options: {
  mode: ThemeMode
  nameField?: DisplayFieldConfig
  professionField?: DisplayFieldConfig
  designationField?: DisplayFieldConfig
  /** Card Settings → Home → Home Heading Color */
  headingField?: DisplayFieldConfig
  /** Card Settings → Home → Home Description Color */
  descriptionField?: DisplayFieldConfig
  /** Legacy header color from Home settings (applies to name). */
  headerTextColor?: string
}): IdentityColors {
  const mode = options.mode === 'dark' ? 'dark' : 'light'
  const header = options.headerTextColor?.trim() || ''

  const homeHeading = fieldTextColor(options.headingField, mode)
  const homeDescription = fieldTextColor(options.descriptionField, mode)

  const nameStyle: CSSProperties = {}
  if (homeHeading) nameStyle.color = homeHeading
  else if (header) nameStyle.color = header
  else nameStyle.color = mode === 'light' ? 'var(--vbiz-secondary)' : '#ffffff'

  const professionStyle: CSSProperties = {}
  if (homeDescription) {
    professionStyle.color = homeDescription
    professionStyle.backgroundImage = 'none'
    professionStyle.WebkitTextFillColor = 'unset'
  } else {
    professionStyle.color = 'var(--vbiz-primary)'
    professionStyle.backgroundImage = 'none'
    professionStyle.WebkitTextFillColor = 'unset'
  }

  return {
    nameStyle,
    professionStyle,
    nameClassName:
      mode === 'light'
        ? 'text-[color:var(--vbiz-secondary)] drop-shadow-[0_1px_2px_rgba(255,255,255,0.85)]'
        : 'text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)]',
    professionClassName:
      'text-[color:var(--vbiz-primary)] drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)] dark:drop-shadow-[0_1px_2px_rgba(0,0,0,0.85)]',
  }
}
