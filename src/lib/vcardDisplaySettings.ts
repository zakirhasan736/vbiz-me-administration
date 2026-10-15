import { normalizeNavOrderWithPinnedEnds, normalizeNavOrderWithRequiredTabs } from '@/lib/createCardTabs'
import type { ThemeMode } from '@/lib/theme/cardThemeContract'
import { readableForeground } from '@/lib/theme/resolveCardTheme'
import { canonicalCssColor } from '@/lib/theme/sectionStyleDefaults'
import {
  LOCKED_NAV_ITEM_IDS,
  NAV_BAR_FIELDS,
  NAV_BAR_NAV_ITEMS,
  NAV_LABELS_HIDDEN_BY_DEFAULT,
  TAB_ID_TO_NAV_LABEL,
} from '@/lib/vcardNavbar'
import type { VCardData, VCardPersonal } from '@/types/vcard'
import {
  clearFieldDisplayColors,
  createDefaultDisplaySettings,
  createDefaultFieldConfig,
  fieldHasColorOverrides,
  fieldModeHasColors,
  normalizeFieldConfig,
  type DisplayFieldConfig,
  type DisplayFieldModeColors,
  type VCardDisplaySettings,
} from '@/types/vcardDisplaySettings'
import type { CSSProperties } from 'react'

type CSSPropertiesWithVariables = CSSProperties & {
  [name: `--${string}`]: string | number | undefined
}

export { NAV_BAR_FIELDS } from '@/lib/vcardNavbar'

export {
  clearFieldDisplayColors,
  createDefaultDisplaySettings,
  createDefaultFieldConfig,
  fieldHasColorOverrides,
  fieldModeHasColors,
  normalizeFieldConfig,
} from '@/types/vcardDisplaySettings'

export type { DisplayFieldModeColors }

type ThemeBrandColors = {
  primaryColor?: string
  secondaryColor?: string
  accentColor?: string
}

export type FieldThemeColorDefaults = {
  light: { text: string; bg: string; icon: string }
  dark: { text: string; bg: string; icon: string }
}

/** Defaults for primary-fill controls (social networks, My vCard, Get your VCard Now). */
export function getFieldThemeColorDefaults(
  theme?: ThemeBrandColors,
  profileTemplate: 'v1' | 'v2' | 'v3' = 'v2'
): FieldThemeColorDefaults {
  const primary = theme?.primaryColor?.trim() || (profileTemplate === 'v1' ? '#dcc969' : '#eab308')
  const secondary = theme?.secondaryColor?.trim() || primary
  const accent = theme?.accentColor?.trim() || primary
  const lightFg = readableForeground(primary)
  const darkFill = accent || primary
  const darkFg = readableForeground(darkFill)
  return {
    light: {
      bg: primary,
      text: contrastSafeForeground(primary, secondary, lightFg),
      icon: contrastSafeForeground(primary, secondary, lightFg),
    },
    dark: {
      bg: darkFill,
      text: contrastSafeForeground(darkFill, secondary, darkFg),
      icon: contrastSafeForeground(darkFill, secondary, darkFg),
    },
  }
}

/**
 * Defaults for secondary-fill controls (Share, Notes, Save Contact, Theme Toggle, rails…).
 * Card Settings pickers and public chrome both use Template secondary as the solid BG.
 */
export function getFieldSecondaryThemeColorDefaults(
  theme?: ThemeBrandColors,
  profileTemplate: 'v1' | 'v2' | 'v3' = 'v2'
): FieldThemeColorDefaults {
  const primary = theme?.primaryColor?.trim() || (profileTemplate === 'v1' ? '#dcc969' : '#eab308')
  const secondary =
    theme?.secondaryColor?.trim() ||
    (profileTemplate === 'v1' ? '#0a0a0a' : profileTemplate === 'v3' ? '#0f2c4d' : '#18181b')
  const accent = theme?.accentColor?.trim() || primary
  const lightFg = contrastSafeForeground(secondary, primary, readableForeground(secondary))
  const darkFg = contrastSafeForeground(secondary, accent, readableForeground(secondary))
  return {
    light: { bg: secondary, text: lightFg, icon: lightFg },
    dark: { bg: secondary, text: darkFg, icon: darkFg },
  }
}

/** Prefer brand secondary when it stays readable on the fill; otherwise WCAG pair. */
function contrastSafeForeground(fill: string, preferred: string, fallback: string): string {
  if (!preferred?.trim() || preferred.trim().toLowerCase() === fill.trim().toLowerCase()) return fallback
  const preferredLum = luminanceOrNull(preferred)
  const fillLum = luminanceOrNull(fill)
  if (preferredLum == null || fillLum == null) return fallback
  if (fillLum > 0.55 && preferredLum > 0.75) return fallback
  if (fillLum <= 0.55 && preferredLum < 0.2) return fallback
  return preferred.trim()
}

function luminanceOrNull(hex: string): number | null {
  const raw = hex.trim()
  if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw)) return null
  let h = raw.slice(1)
  if (h.length === 3) {
    h = h
      .split('')
      .map((c) => c + c)
      .join('')
  }
  const r = parseInt(h.slice(0, 2), 16) / 255
  const g = parseInt(h.slice(2, 4), 16) / 255
  const b = parseInt(h.slice(4, 6), 16) / 255
  const lin = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4))
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b)
}

function firstColor(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/**
 * Resolve owner colors for the active theme mode.
 * Legacy flat colors apply to light only so dark mode keeps Template theme tokens.
 */
export function resolveFieldModeColors(
  config: DisplayFieldConfig | undefined,
  mode: ThemeMode,
  options?: { preferText?: boolean }
): { fill?: string; fg?: string } {
  if (!config) return {}
  const nested = mode === 'dark' ? config.dark : config.light
  const preferText = options?.preferText === true
  if (fieldModeHasColors(nested)) {
    return {
      fill: firstColor(nested?.backgroundColor),
      fg: preferText
        ? firstColor(nested?.textColor, nested?.iconColor)
        : firstColor(nested?.iconColor, nested?.textColor),
    }
  }
  if (mode === 'light') {
    return {
      fill: firstColor(config.backgroundColor),
      fg: preferText ? firstColor(config.textColor, config.iconColor) : firstColor(config.iconColor, config.textColor),
    }
  }
  return {}
}

/** Values shown in light/dark pickers (saved override or Template brand default). */
export function getFieldModePickerValues(
  config: DisplayFieldConfig,
  mode: ThemeMode,
  defaults: { text: string; bg: string; icon: string }
): { text: string; bg: string; icon: string } {
  const nested = mode === 'dark' ? config.dark : config.light
  if (fieldModeHasColors(nested)) {
    return {
      text: firstColor(nested?.textColor, nested?.iconColor) || defaults.text,
      bg: firstColor(nested?.backgroundColor) || defaults.bg,
      icon: firstColor(nested?.iconColor, nested?.textColor) || defaults.icon,
    }
  }
  if (mode === 'light') {
    return {
      text: firstColor(config.textColor, config.iconColor) || defaults.text,
      bg: firstColor(config.backgroundColor) || defaults.bg,
      icon: firstColor(config.iconColor, config.textColor) || defaults.icon,
    }
  }
  return defaults
}

function storedCssColor(value: string | undefined): string | undefined {
  if (!value?.trim()) return undefined
  return canonicalCssColor(value, true) || undefined
}

/** Patch light or dark colors. A chosen text or icon color is kept. Readable text is filled only when none is set. */
export function buildModeColorPatch(
  config: DisplayFieldConfig,
  mode: ThemeMode,
  patch: Partial<DisplayFieldModeColors>
): Partial<DisplayFieldConfig> {
  const current = { ...(mode === 'dark' ? config.dark : config.light) }
  const next: DisplayFieldModeColors = { ...current }
  if ('backgroundColor' in patch)
    next.backgroundColor = storedCssColor(patch.backgroundColor) ?? current.backgroundColor
  if ('textColor' in patch) next.textColor = storedCssColor(patch.textColor) ?? current.textColor
  if ('iconColor' in patch) next.iconColor = storedCssColor(patch.iconColor) ?? current.iconColor

  if (patch.backgroundColor?.trim() && !next.textColor?.trim() && !next.iconColor?.trim()) {
    const fill = storedCssColor(patch.backgroundColor)
    if (fill) next.textColor = readableForeground(fill)
  }

  const cleanedMode = normalizeFieldConfig({
    visible: config.visible,
    [mode]: next,
  })[mode]

  return {
    light: mode === 'light' ? cleanedMode : config.light,
    dark: mode === 'dark' ? cleanedMode : config.dark,
    textColor: undefined,
    backgroundColor: undefined,
    iconColor: undefined,
  }
}

export function setCategoryResetColors(settings: VCardDisplaySettings, keys: readonly string[]): VCardDisplaySettings {
  let next = settings
  for (const key of keys) {
    const current = getFieldConfig(next, key)
    if (!fieldHasColorOverrides(current)) continue
    next = {
      ...next,
      fields: {
        ...next.fields,
        [key]: clearFieldDisplayColors(current),
      },
    }
  }
  return next
}

export const MY_INFO_FIELDS = [
  'MyInfo section Name',
  'MyInfo Profession',
  'MyInfo Designation',
  'MyInfo Company',
  'MyInfo Address',
  'MyInfo Email',
  'MyInfo Phone',
  'MyInfo Whatsapp',
  'MyInfo Company / Office Name',
  'MyInfo section Company / Office Name',
  'MyInfo Relationship Status',
  'MyInfo Website',
  'Name',
  'Profession',
  'Designation',
  'Age',
  'Gender',
  'About Me',
] as const

export const SOCIAL_LINK_FIELDS = [
  'FaceBook',
  'Twitter',
  'Instagram',
  'TikTok',
  'Youtube',
  'LinkedIn',
  'Whatsapp',
  'Rumble',
  'Truth',
  'Pinterest',
  'Share',
  'Notifications',
  'Notepad',
  '1-on-1',
  'Vcard View Counter',
  'Language',
  'CRM',
  'Website',
] as const

export const ICON_FIELDS = [
  'Profession Icon',
  'Name',
  'Age Icon',
  'Address Icon',
  'Email Icon',
  'Phone Icon',
  'Company/Office Icon',
  'Gender Icon',
  'Relationship Status Icon',
  'My Info Website Icon',
  'My Info Whatsapp',
] as const

/** Public My Info tab Call / Text / Email pills (Card Settings → My Info Buttons). */
export const MY_INFO_ACTION_FIELDS = ['My Info Call Btn', 'My Info Text Btn', 'My Info Email Btn'] as const

export const GENERAL_SETTINGS_FIELDS = [
  'Pages Header',
  'Save Contact',
  'Save to Wallet',
  'My Info Btn',
  'My vCard Btn',
  'Theme Toggle',
  'Get your VCard Now',
] as const

/**
 * Defaults for My Info Call / Text / Email.
 * Light and dark follow that mode’s Template primary. A saved field color replaces it.
 */
export function getMyInfoActionButtonColorDefaults(
  theme?: ThemeBrandColors,
  profileTemplate: 'v1' | 'v2' | 'v3' = 'v2',
  modes?: { lightPrimary?: string; darkPrimary?: string }
): { light: { text: string; bg: string; icon: string }; dark: { text: string; bg: string; icon: string } } {
  const fallback =
    theme?.primaryColor?.trim() ||
    theme?.secondaryColor?.trim() ||
    (profileTemplate === 'v1' ? '#dcc969' : profileTemplate === 'v3' ? '#0f2c4d' : '#eab308')
  const lightBg = modes?.lightPrimary?.trim() || fallback
  const darkBg = modes?.darkPrimary?.trim() || theme?.accentColor?.trim() || lightBg
  const lightFg = readableForeground(lightBg)
  const darkFg = readableForeground(darkBg)
  return {
    light: { bg: lightBg, text: lightFg, icon: lightFg },
    dark: { bg: darkBg, text: darkFg, icon: darkFg },
  }
}

/** Legacy key kept for API/visibility sync; colors live on Social → Share. */
export const LEGACY_SHARE_BTN_FIELD = 'Share Btn' as const

/** Utility / action fields that default to Template secondary as background. */
export const SECONDARY_BG_DISPLAY_FIELDS = [
  'Share',
  LEGACY_SHARE_BTN_FIELD,
  'Notifications',
  'Notepad',
  '1-on-1',
  'Vcard View Counter',
  'Language',
  'CRM',
  'Website',
  'Save Contact',
  'Save to Wallet',
  'My Info Btn',
  'Theme Toggle',
] as const

export const SECONDARY_BG_DISPLAY_FIELD_SET = new Set<string>(SECONDARY_BG_DISPLAY_FIELDS)

export function isSecondaryBgDisplayField(key: string): boolean {
  return SECONDARY_BG_DISPLAY_FIELD_SET.has(key)
}

export const HOME_PAGE_FIELDS = [
  'Intro vCard Video',
  'Intro YouTube vCard Video Link',
  'Background Music',
  'YouTube Background Music Link',
  'Background Video/Image',
  'Profile Image/Video',
  'Home Heading Color',
  'Home Description Color',
  'vCard Header Color',
  'Repeat Background Music',
] as const

/** Home fields that store a media/URL `customValue` (not colors or toggle-only). */
export const HOME_PAGE_URL_FIELDS = new Set<string>([
  'Intro vCard Video',
  'Intro YouTube vCard Video Link',
  'Background Music',
  'YouTube Background Music Link',
  'Background Video/Image',
  'Profile Image/Video',
])

/** Home fields that expose light/dark text color pickers. */
export const HOME_PAGE_COLOR_FIELDS = new Set<string>([
  'Home Heading Color',
  'Home Description Color',
  'vCard Header Color',
])

export const ALL_DISPLAY_FIELD_KEYS = [
  ...MY_INFO_FIELDS,
  ...SOCIAL_LINK_FIELDS,
  ...ICON_FIELDS,
  ...GENERAL_SETTINGS_FIELDS,
  ...MY_INFO_ACTION_FIELDS,
  LEGACY_SHARE_BTN_FIELD,
  ...HOME_PAGE_FIELDS,
  ...NAV_BAR_FIELDS,
] as const

/** Maps back-office My Info labels to personal data keys on the vCard. */
export const MY_INFO_TO_PERSONAL: Record<string, keyof VCardPersonal> = {
  'MyInfo section Name': 'fullName',
  Name: 'fullName',
  'MyInfo Profession': 'profession',
  Profession: 'profession',
  'MyInfo Designation': 'designation',
  Designation: 'designation',
  'MyInfo Company': 'company',
  'MyInfo Company / Office Name': 'company',
  'MyInfo section Company / Office Name': 'company',
  'MyInfo Address': 'address',
  'MyInfo Email': 'email',
  'MyInfo Phone': 'phone',
  'MyInfo Whatsapp': 'whatsapp',
  'MyInfo Website': 'website',
  'MyInfo Relationship Status': 'relationship',
  Gender: 'gender',
  'About Me': 'about',
}

export { NAV_LABEL_TO_TAB_ID, TAB_ID_TO_NAV_LABEL } from '@/lib/vcardNavbar'

/** Maps social link setting labels to lucide/network keys used in the profile home grid. */
export const SOCIAL_LABEL_TO_NETWORK: Record<string, string> = {
  FaceBook: 'facebook',
  Twitter: 'twitter',
  Instagram: 'instagram',
  LinkedIn: 'linkedin',
  Youtube: 'youtube',
  Whatsapp: 'whatsapp',
  Website: 'website',
}

const DEFAULT_SETTINGS = createDefaultDisplaySettings([...ALL_DISPLAY_FIELD_KEYS], NAV_LABELS_HIDDEN_BY_DEFAULT)

function getDefaultConfigForKey(key: string): DisplayFieldConfig {
  return createDefaultFieldConfig(NAV_LABELS_HIDDEN_BY_DEFAULT.has(key) ? { visible: false } : undefined)
}

export function resolveDisplaySettings(raw?: VCardDisplaySettings | null): VCardDisplaySettings {
  if (!raw) return DEFAULT_SETTINGS
  const fields = { ...DEFAULT_SETTINGS.fields }
  for (const [key, config] of Object.entries(raw.fields || {})) {
    // Keep Card Settings colors for public vCard; only strip legacy auto #000/#fff placeholders.
    fields[key] = normalizeFieldConfig({ ...fields[key], ...config })
  }
  const editorNavOrder = Array.isArray(raw.editorNavOrder)
    ? raw.editorNavOrder.filter((id): id is string => typeof id === 'string' && Boolean(id))
    : undefined
  return {
    globalEnabled: raw.globalEnabled ?? true,
    fields,
    ...(editorNavOrder?.length ? { editorNavOrder } : {}),
    ...(raw.navOrderCustomized ? { navOrderCustomized: true } : {}),
  }
}

/** Colors shown in the back-office pickers when a field has no custom override yet. */
export function getFieldColorPreview(
  kind: 'text' | 'bg' | 'icon',
  theme?: { primaryColor?: string; accentColor?: string },
  profileTemplate: 'v1' | 'v2' = 'v2'
): string {
  const accent = theme?.accentColor || (profileTemplate === 'v1' ? '#dcc969' : '#eab308')
  const primary = theme?.primaryColor || accent
  switch (kind) {
    case 'text':
      return profileTemplate === 'v1' ? '#e0e0e0' : '#18181b'
    case 'bg':
      return profileTemplate === 'v1' ? '#050505' : '#fafafa'
    case 'icon':
      return accent
    default:
      return primary
  }
}

export function getFieldConfig(settings: VCardDisplaySettings, key: string): DisplayFieldConfig {
  return settings.fields[key] ?? getDefaultConfigForKey(key)
}

export function isFieldVisible(settings: VCardDisplaySettings, key: string): boolean {
  if (!settings.globalEnabled) return false
  return getFieldConfig(settings, key).visible
}

export function isFieldVisibleInProfile(settings: VCardDisplaySettings, key: string): boolean {
  return isFieldVisible(settings, key)
}

export function getDisplaySettingsFromVCard(data: VCardData): VCardDisplaySettings {
  return resolveDisplaySettings(data.displaySettings)
}

export function patchDisplayField(
  settings: VCardDisplaySettings,
  key: string,
  patch: Partial<DisplayFieldConfig>
): VCardDisplaySettings {
  const current = getFieldConfig(settings, key)
  const merged: DisplayFieldConfig = {
    ...current,
    ...patch,
    visible: patch.visible ?? current.visible,
  }
  // Explicit undefined from mode patches means "clear legacy flat colors".
  if ('textColor' in patch && patch.textColor === undefined) delete merged.textColor
  if ('backgroundColor' in patch && patch.backgroundColor === undefined) delete merged.backgroundColor
  if ('iconColor' in patch && patch.iconColor === undefined) delete merged.iconColor
  if ('light' in patch && patch.light === undefined) delete merged.light
  if ('dark' in patch && patch.dark === undefined) delete merged.dark
  if ('mediaFrame' in patch && patch.mediaFrame === undefined) delete merged.mediaFrame

  return {
    ...settings,
    fields: {
      ...settings.fields,
      [key]: normalizeFieldConfig(merged),
    },
    ...(settings.editorNavOrder?.length ? { editorNavOrder: settings.editorNavOrder } : {}),
    ...(settings.navOrderCustomized ? { navOrderCustomized: true } : {}),
  }
}

/**
 * Enable only the given editor nav ids (by visibility) and persist their order
 * into displaySettings for DB round-trip.
 */
export function applyEnabledNavOrderToDisplaySettings(
  settings: VCardDisplaySettings,
  navIds: string[],
  options?: { preserveCustom?: boolean }
): VCardDisplaySettings {
  const preserveCustom = options?.preserveCustom ?? Boolean(settings.navOrderCustomized)
  const normalized = preserveCustom
    ? normalizeNavOrderWithRequiredTabs(navIds)
    : normalizeNavOrderWithPinnedEnds(navIds)
  const idSet = new Set(normalized)
  let next: VCardDisplaySettings = {
    ...settings,
    fields: { ...settings.fields },
    editorNavOrder: normalized,
    ...(preserveCustom ? { navOrderCustomized: true } : { navOrderCustomized: undefined }),
  }
  for (const item of NAV_BAR_NAV_ITEMS) {
    const visible = LOCKED_NAV_ITEM_IDS.has(item.id) || idSet.has(item.id)
    next = patchDisplayField(next, item.label, { visible })
  }
  next.editorNavOrder = normalized
  if (preserveCustom) next.navOrderCustomized = true
  else delete next.navOrderCustomized
  return next
}

export function setCategoryEnableAll(
  settings: VCardDisplaySettings,
  keys: readonly string[],
  enabled: boolean
): VCardDisplaySettings {
  let next = settings
  for (const key of keys) {
    next = patchDisplayField(next, key, { visible: enabled })
  }
  return next
}

export function getPersonalValueForField(personal: VCardPersonal, fieldKey: string): string {
  const path = MY_INFO_TO_PERSONAL[fieldKey]
  if (!path) return ''
  const value = personal[path]
  return typeof value === 'string' ? value.trim() : ''
}

export function getHomeMediaUrls(settings: VCardDisplaySettings) {
  const isYoutube = (url: string) => /youtu\.?be/i.test(url)

  const visibleValue = (key: string) => {
    if (!isFieldVisible(settings, key)) return ''
    return getFieldConfig(settings, key).customValue?.trim() || ''
  }

  const introFile = visibleValue('Intro vCard Video')
  const introYoutube = visibleValue('Intro YouTube vCard Video Link')

  // Intro preloader only — 2D explainer lives in its own section tab.
  const introVideo = introFile && !isYoutube(introFile) ? introFile : ''

  const bgMedia = visibleValue('Background Video/Image')
  const profileMedia = visibleValue('Profile Image/Video')
  return { introVideo, introYoutube, bgMedia, profileMedia }
}

/** Background color for nav tabs from Card Settings → Nav Bar (editor + public). */
export function getNavTabBackgroundColor(settings: VCardDisplaySettings, tabId: string): string | undefined {
  const navLabel = TAB_ID_TO_NAV_LABEL[tabId]
  if (!navLabel) return undefined
  return getFieldConfig(settings, navLabel).backgroundColor || undefined
}

/**
 * When Nav Bar settings toggles a tab's visibility, keep `editorNavOrder` in sync
 * with Add Tab so public nav enable/order stay consistent.
 */
export function syncEditorNavOrderAfterNavVisibilityChange(
  settings: VCardDisplaySettings,
  navLabel: string,
  visible: boolean
): VCardDisplaySettings {
  const navItem = NAV_BAR_NAV_ITEMS.find((item) => item.label === navLabel)
  if (!navItem) return settings
  if (LOCKED_NAV_ITEM_IDS.has(navItem.id)) {
    return patchDisplayField(settings, navLabel, { visible: true })
  }

  const currentOrder =
    Array.isArray(settings.editorNavOrder) && settings.editorNavOrder.length > 0
      ? [...settings.editorNavOrder]
      : NAV_BAR_NAV_ITEMS.filter((item) => getFieldConfig(settings, item.label).visible).map((item) => item.id)

  let nextOrder: string[]
  if (visible) {
    nextOrder = currentOrder.includes(navItem.id) ? currentOrder : [...currentOrder, navItem.id]
  } else {
    nextOrder = currentOrder.filter((id) => id !== navItem.id)
  }

  return applyEnabledNavOrderToDisplaySettings(settings, nextOrder)
}

/** Page-level colors from Card Settings → Home / Nav Bar. Home BG/banner retired in favor of Wallpaper. */
export function getPageColors(settings: VCardDisplaySettings, mode: ThemeMode = 'light') {
  const headerField = getFieldConfig(settings, 'vCard Header Color')
  const resolved = resolveFieldModeColors(headerField, mode, { preferText: true })
  const headerColor = isFieldVisible(settings, 'vCard Header Color')
    ? storedCssColor(resolved.fg) ||
      storedCssColor(resolved.fill) ||
      storedCssColor(headerField.textColor) ||
      storedCssColor(headerField.backgroundColor)
    : undefined
  const navBg = getFieldConfig(settings, 'Nav Background Color').backgroundColor || undefined
  return {
    pageBg: undefined,
    pageBanner: undefined,
    headerColor,
    navBg,
  }
}

/** First non-empty color from several Card Settings fields (e.g. Share + Share Btn). */
export function mergeDisplayFieldConfigs(...configs: Array<DisplayFieldConfig | undefined>): DisplayFieldConfig {
  const lightBg = firstColor(...configs.map((config) => config?.light?.backgroundColor))
  const lightFg = firstColor(
    ...configs.map((config) => config?.light?.iconColor),
    ...configs.map((config) => config?.light?.textColor)
  )
  const darkBg = firstColor(...configs.map((config) => config?.dark?.backgroundColor))
  const darkFg = firstColor(
    ...configs.map((config) => config?.dark?.iconColor),
    ...configs.map((config) => config?.dark?.textColor)
  )

  return normalizeFieldConfig({
    visible: configs.some((config) => config?.visible !== false),
    textColor: firstColor(...configs.map((config) => config?.textColor)),
    backgroundColor: firstColor(...configs.map((config) => config?.backgroundColor)),
    iconColor: firstColor(...configs.map((config) => config?.iconColor)),
    ...(lightBg || lightFg
      ? {
          light: {
            backgroundColor: lightBg,
            textColor: lightFg,
            iconColor: lightFg,
          },
        }
      : {}),
    ...(darkBg || darkFg
      ? {
          dark: {
            backgroundColor: darkBg,
            textColor: darkFg,
            iconColor: darkFg,
          },
        }
      : {}),
  })
}

type ChromeColorDefaults = { bg: string; text: string }

function resolveChromePaint(
  config: DisplayFieldConfig | undefined,
  mode: ThemeMode,
  defaults?: ChromeColorDefaults,
  options?: { preferText?: boolean }
): { paintFill?: string; paintFg?: string } {
  const { fill, fg } = resolveFieldModeColors(config, mode, options)
  const paintFill =
    storedCssColor(fill) || (defaults?.bg ? storedCssColor(defaults.bg) || defaults.bg.trim() : undefined)
  const paintFg =
    storedCssColor(fg) || (defaults?.text ? storedCssColor(defaults.text) || defaults.text.trim() : undefined)
  return {
    paintFill: paintFill || undefined,
    paintFg: paintFg || undefined,
  }
}

/**
 * Per-button colors from Card Settings. Sets CSS variables the themed
 * `.vbiz-social` / `.vbiz-icon-btn` / `.vbiz-btn` rules already read, so
 * `!important` theme tokens still apply — but use the owner's color when set.
 * Pass `defaults` so Template primary/secondary fills paint before a custom override.
 */
export function displaySocialChromeStyle(
  config?: DisplayFieldConfig,
  mode: ThemeMode = 'light',
  defaults?: ChromeColorDefaults
): CSSProperties | undefined {
  const { paintFill, paintFg } = resolveChromePaint(config, mode, defaults)
  if (!paintFill && !paintFg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (paintFill) {
    style['--vbiz-control-fill'] = paintFill
    style['--vbiz-control-border'] = paintFill
    style['--vbiz-social-fill'] = paintFill
    style['--vbiz-social-border-color'] = paintFill
    style.backgroundColor = paintFill
  }
  if (paintFg) {
    style['--vbiz-control-fg'] = paintFg
    style['--vbiz-social-fg'] = paintFg
    style.color = paintFg
  }
  return style
}

export function displayIconChromeStyle(
  config?: DisplayFieldConfig,
  mode: ThemeMode = 'light',
  defaults?: ChromeColorDefaults
): CSSProperties | undefined {
  const { paintFill, paintFg } = resolveChromePaint(config, mode, defaults)
  if (!paintFill && !paintFg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (paintFill) {
    style['--vbiz-control-fill'] = paintFill
    style['--vbiz-control-border'] = paintFill
    style['--vbiz-btn-secondary-fill'] = paintFill
    style['--vbiz-btn-secondary-border-color'] = paintFill
    style.backgroundColor = paintFill
  }
  if (paintFg) {
    style['--vbiz-control-fg'] = paintFg
    style['--vbiz-btn-secondary-fg'] = paintFg
    style.color = paintFg
  }
  return style
}

export function displayCtaChromeStyle(
  config?: DisplayFieldConfig,
  mode: ThemeMode = 'light',
  defaults?: ChromeColorDefaults
): CSSProperties | undefined {
  const { paintFill, paintFg } = resolveChromePaint(config, mode, defaults, { preferText: true })
  if (!paintFill && !paintFg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (paintFill) {
    style['--vbiz-control-fill'] = paintFill
    style['--vbiz-control-border'] = paintFill
    style['--vbiz-btn-fill'] = paintFill
    style['--vbiz-btn-accent-fill'] = paintFill
    style['--vbiz-btn-primary-fill'] = paintFill
    style['--vbiz-btn-secondary-fill'] = paintFill
  }
  if (paintFg) {
    style['--vbiz-control-fg'] = paintFg
    style['--vbiz-btn-fg'] = paintFg
    style['--vbiz-btn-accent-fg'] = paintFg
    style['--vbiz-btn-primary-fg'] = paintFg
    style['--vbiz-btn-secondary-fg'] = paintFg
  }
  return style
}

/** Mode slice of Template secondary defaults for public icon / secondary CTA chrome. */
export function secondaryChromeDefaultsForMode(
  theme: ThemeBrandColors | undefined,
  mode: ThemeMode,
  profileTemplate: 'v1' | 'v2' | 'v3' = 'v2'
): ChromeColorDefaults {
  const defaults = getFieldSecondaryThemeColorDefaults(theme, profileTemplate)
  const slice = mode === 'dark' ? defaults.dark : defaults.light
  return { bg: slice.bg, text: slice.text }
}

/** Mode slice of Template primary defaults for social / primary CTA chrome. */
export function primaryChromeDefaultsForMode(
  theme: ThemeBrandColors | undefined,
  mode: ThemeMode,
  profileTemplate: 'v1' | 'v2' | 'v3' = 'v2'
): ChromeColorDefaults {
  const defaults = getFieldThemeColorDefaults(theme, profileTemplate)
  const slice = mode === 'dark' ? defaults.dark : defaults.light
  return { bg: slice.bg, text: slice.text }
}

/**
 * Solid pill chrome for My Info Call / Text / Email.
 * A saved light/dark color replaces the Template primary default for that button only.
 */
export function displayMyInfoActionChromeStyle(
  config: DisplayFieldConfig | undefined,
  mode: ThemeMode,
  defaults: { bg: string; text: string }
): CSSProperties {
  const { fill, fg } = resolveFieldModeColors(config, mode, { preferText: true })
  const backgroundColor = storedCssColor(fill) || storedCssColor(defaults.bg) || defaults.bg
  const color = storedCssColor(fg) || storedCssColor(defaults.text) || defaults.text
  const style: CSSPropertiesWithVariables = {
    backgroundColor,
    color,
    backgroundImage: 'none',
  }
  style['--vbiz-control-fill'] = backgroundColor
  style['--vbiz-control-fg'] = color
  style['--vbiz-my-info-fill'] = backgroundColor
  style['--vbiz-my-info-fg'] = color
  return style
}

export function displayLiveAgentChromeStyle(
  config?: DisplayFieldConfig,
  mode: ThemeMode = 'light'
): CSSProperties | undefined {
  const { fill, fg } = resolveFieldModeColors(config, mode)
  if (!fill && !fg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (fill) style['--vbiz-live-agent-fill'] = fill
  if (fg) style['--vbiz-live-agent-fg'] = fg
  return style
}

/**
 * Card Settings → General. Sets scoped CSS variables on the profile root.
 * Pages Header colors apply only to section headers; `--vbiz-bg` / `--vbiz-surface`
 * still swap with dark/light. Home BG/banner come from Template → Wallpaper.
 */
export function displayGeneralRootStyle(
  settings: VCardDisplaySettings,
  mode: ThemeMode = 'light'
): CSSProperties | undefined {
  const style: CSSPropertiesWithVariables = {}
  const pagesHeader = getFieldConfig(settings, 'Pages Header')

  if (pagesHeader.visible !== false) {
    const { fill, fg } = resolveFieldModeColors(pagesHeader, mode)
    if (fg) style['--vbiz-page-header-fg'] = fg
    if (fill) style['--vbiz-page-header-fill'] = fill
  }

  const homeHeading = getFieldConfig(settings, 'Home Heading Color')
  if (homeHeading.visible !== false) {
    const { fg } = resolveFieldModeColors(homeHeading, mode, { preferText: true })
    const paint = storedCssColor(fg)
    if (paint) style['--vbiz-home-heading'] = paint
  }

  const homeDescription = getFieldConfig(settings, 'Home Description Color')
  if (homeDescription.visible !== false) {
    const { fg } = resolveFieldModeColors(homeDescription, mode, { preferText: true })
    const paint = storedCssColor(fg)
    if (paint) style['--vbiz-home-description'] = paint
  }

  return Object.keys(style).length > 0 ? style : undefined
}

export function isPagesHeaderVisible(settings: VCardDisplaySettings): boolean {
  return getFieldConfig(settings, 'Pages Header').visible !== false
}
