/** Per-theme-mode button/social colors from Card Settings. */
export type DisplayFieldModeColors = {
  textColor?: string
  backgroundColor?: string
  iconColor?: string
}

/** Per-field visibility and styling from Card Settings (back office). */
export type DisplayFieldConfig = {
  visible: boolean
  /**
   * Legacy flat colors (pre light/dark pickers). Applied to **light** mode only
   * when `light` / `dark` are unset, so dark theme keeps global theme tokens.
   */
  textColor?: string
  backgroundColor?: string
  iconColor?: string
  /** Colors used while the public card is in light mode. */
  light?: DisplayFieldModeColors
  /** Colors used while the public card is in dark mode. */
  dark?: DisplayFieldModeColors
  /** Home page URL / text overrides */
  customValue?: string
}

export type VCardDisplaySettings = {
  /** Master switch; when false, all fields are hidden unless individually forced on */
  globalEnabled: boolean
  fields: Record<string, DisplayFieldConfig>
  /**
   * Editor tab strip order (nav item ids). Persisted in display_settings_json
   * so AI / Add Tabs selections survive create → edit.
   */
  editorNavOrder?: string[]
  /** When true, keep the owner's dragged tab order instead of the default Home → FAQ list. */
  navOrderCustomized?: boolean
}

/** Legacy placeholders from the first settings UI — treated as "use app theme". */
const LEGACY_AUTO_COLORS = new Set(['#ffffff', '#fff', '#000000', '#000'])

function scrubColor(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  const trimmed = value.trim()
  if (LEGACY_AUTO_COLORS.has(trimmed.toLowerCase())) return undefined
  return trimmed
}

/** Keep intentional black/white chosen for light/dark button contrast. */
function scrubModeColor(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function normalizeModeColors(mode?: DisplayFieldModeColors): DisplayFieldModeColors | undefined {
  if (!mode) return undefined
  const next: DisplayFieldModeColors = {}
  const textColor = scrubModeColor(mode.textColor)
  const backgroundColor = scrubModeColor(mode.backgroundColor)
  const iconColor = scrubModeColor(mode.iconColor)
  if (textColor) next.textColor = textColor
  if (backgroundColor) next.backgroundColor = backgroundColor
  if (iconColor) next.iconColor = iconColor
  return Object.keys(next).length ? next : undefined
}

/** Strip auto-filled black/white so the profile uses Tailwind + theme CSS again. */
export function normalizeFieldConfig(config: DisplayFieldConfig): DisplayFieldConfig {
  const next: DisplayFieldConfig = { visible: config.visible }
  if (config.customValue !== undefined) next.customValue = config.customValue

  const textColor = scrubColor(config.textColor)
  const backgroundColor = scrubColor(config.backgroundColor)
  const iconColor = scrubColor(config.iconColor)
  if (textColor) next.textColor = textColor
  if (backgroundColor) next.backgroundColor = backgroundColor
  if (iconColor) next.iconColor = iconColor

  const light = normalizeModeColors(config.light)
  const dark = normalizeModeColors(config.dark)
  if (light) next.light = light
  if (dark) next.dark = dark

  return next
}

/** Remove all color overrides so the field uses Template primary/secondary/accent. */
export function clearFieldDisplayColors(config: DisplayFieldConfig): DisplayFieldConfig {
  const next = normalizeFieldConfig({ ...config })
  delete next.textColor
  delete next.backgroundColor
  delete next.iconColor
  delete next.light
  delete next.dark
  return next
}

/**
 * @deprecated Prefer clearFieldDisplayColors / normalizeFieldConfig.
 * Kept for any legacy callers that still need a full color wipe.
 */
export function stripFieldDisplayColors(config: DisplayFieldConfig): DisplayFieldConfig {
  return clearFieldDisplayColors(config)
}

export function createDefaultFieldConfig(overrides?: Partial<DisplayFieldConfig>): DisplayFieldConfig {
  return normalizeFieldConfig({
    visible: true,
    ...overrides,
  })
}

export function createDefaultDisplaySettings(
  fieldKeys: string[],
  hiddenByDefault?: ReadonlySet<string>
): VCardDisplaySettings {
  const fields: Record<string, DisplayFieldConfig> = {}
  for (const key of fieldKeys) {
    fields[key] = createDefaultFieldConfig(hiddenByDefault?.has(key) ? { visible: false } : undefined)
  }
  return { globalEnabled: true, fields }
}

export function fieldModeHasColors(mode?: DisplayFieldModeColors): boolean {
  if (!mode) return false
  return Boolean(mode.textColor?.trim() || mode.backgroundColor?.trim() || mode.iconColor?.trim())
}

export function fieldHasColorOverrides(config: DisplayFieldConfig): boolean {
  return Boolean(
    config.textColor?.trim() ||
    config.backgroundColor?.trim() ||
    config.iconColor?.trim() ||
    fieldModeHasColors(config.light) ||
    fieldModeHasColors(config.dark)
  )
}
