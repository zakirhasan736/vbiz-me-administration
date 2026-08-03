/** Per-field visibility and styling from Card Settings (back office). */
export type DisplayFieldConfig = {
  visible: boolean
  textColor?: string
  backgroundColor?: string
  iconColor?: string
  /** Home page URL / text overrides */
  customValue?: string
}

export type VCardDisplaySettings = {
  /** Master switch; when false, all fields are hidden unless individually forced on */
  globalEnabled: boolean
  fields: Record<string, DisplayFieldConfig>
}

/** Legacy placeholders from the first settings UI — treated as "use app theme". */
const LEGACY_AUTO_COLORS = new Set(['#ffffff', '#fff', '#000000', '#000'])

/** Strip auto-filled black/white so the profile uses Tailwind + theme CSS again. */
export function normalizeFieldConfig(config: DisplayFieldConfig): DisplayFieldConfig {
  const next = { ...config }
  if (next.textColor && LEGACY_AUTO_COLORS.has(next.textColor.toLowerCase())) {
    delete next.textColor
  }
  if (next.backgroundColor && LEGACY_AUTO_COLORS.has(next.backgroundColor.toLowerCase())) {
    delete next.backgroundColor
  }
  if (next.iconColor && LEGACY_AUTO_COLORS.has(next.iconColor.toLowerCase())) {
    delete next.iconColor
  }
  return next
}

/** Remove API-driven colors so public profiles use static template styling only. */
export function stripFieldDisplayColors(config: DisplayFieldConfig): DisplayFieldConfig {
  const next = normalizeFieldConfig({ ...config })
  delete next.textColor
  delete next.backgroundColor
  delete next.iconColor
  return next
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
