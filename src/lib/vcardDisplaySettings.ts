import { normalizeNavOrderWithPinnedEnds, normalizeNavOrderWithRequiredTabs } from '@/lib/createCardTabs'
import {
  LOCKED_NAV_ITEM_IDS,
  NAV_BAR_FIELDS,
  NAV_BAR_NAV_ITEMS,
  NAV_LABELS_HIDDEN_BY_DEFAULT,
  TAB_ID_TO_NAV_LABEL,
} from '@/lib/vcardNavbar'
import type { VCardData, VCardPersonal } from '@/types/vcard'
import {
  createDefaultDisplaySettings,
  createDefaultFieldConfig,
  normalizeFieldConfig,
  type DisplayFieldConfig,
  type VCardDisplaySettings,
} from '@/types/vcardDisplaySettings'
import type { CSSProperties } from 'react'

type CSSPropertiesWithVariables = CSSProperties & {
  [name: `--${string}`]: string | number | undefined
}

export { NAV_BAR_FIELDS } from '@/lib/vcardNavbar'

export {
  createDefaultDisplaySettings,
  createDefaultFieldConfig,
  normalizeFieldConfig,
} from '@/types/vcardDisplaySettings'

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

export const GENERAL_SETTINGS_FIELDS = [
  'Pages Header',
  'Save Contact',
  'My Info Btn',
  'My vCard Btn',
  'Share Btn',
  'Get your VCard Now',
  'Your QR Code',
  'Home Page BG Color',
  'Home Page Banner Color',
] as const

export const HOME_PAGE_FIELDS = [
  'Intro vCard Video',
  'Intro YouTube vCard Video Link',
  'Background Music',
  'YouTube Background Music Link',
  'Background Video/Image',
  'Profile Image/Video',
  'Save Contact',
  'Skills',
  'vCard Header Color',
  'Info Box Style',
  'Repeat Background Music',
] as const

export const ALL_DISPLAY_FIELD_KEYS = [
  ...MY_INFO_FIELDS,
  ...SOCIAL_LINK_FIELDS,
  ...ICON_FIELDS,
  ...GENERAL_SETTINGS_FIELDS,
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
  return {
    ...settings,
    fields: {
      ...settings.fields,
      [key]: { ...current, ...patch },
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

export function getHomeMediaUrls(settings: VCardDisplaySettings, _personal: VCardPersonal) {
  const introFile = getFieldConfig(settings, 'Intro vCard Video').customValue?.trim() || ''
  const introYoutube = getFieldConfig(settings, 'Intro YouTube vCard Video Link').customValue?.trim() || ''

  const isYoutube = (url: string) => /youtu\.?be/i.test(url)

  // Intro preloader only — 2D explainer lives in its own section tab.
  const introVideo = introFile && !isYoutube(introFile) ? introFile : ''

  const bgMedia = getFieldConfig(settings, 'Background Video/Image').customValue?.trim() || ''
  const profileMedia = getFieldConfig(settings, 'Profile Image/Video').customValue?.trim() || ''
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

/** Page-level colors from Card Settings → General / Home / Nav Bar. */
export function getPageColors(settings: VCardDisplaySettings) {
  const pageBgField = getFieldConfig(settings, 'Home Page BG Color')
  const pageBannerField = getFieldConfig(settings, 'Home Page Banner Color')
  const pageBg = pageBgField.visible === false ? undefined : pageBgField.backgroundColor || undefined
  const pageBanner = pageBannerField.visible === false ? undefined : pageBannerField.backgroundColor || undefined
  const headerField = getFieldConfig(settings, 'vCard Header Color')
  const headerColor = headerField.textColor || headerField.backgroundColor || undefined
  const navBg = getFieldConfig(settings, 'Nav Background Color').backgroundColor || undefined
  return {
    pageBg,
    pageBanner,
    headerColor,
    navBg,
  }
}

function firstColor(...values: Array<string | undefined>): string | undefined {
  for (const value of values) {
    const trimmed = value?.trim()
    if (trimmed) return trimmed
  }
  return undefined
}

/** First non-empty color from several Card Settings fields (e.g. Share + Share Btn). */
export function mergeDisplayFieldConfigs(...configs: Array<DisplayFieldConfig | undefined>): DisplayFieldConfig {
  return {
    visible: configs.some((config) => config?.visible !== false),
    textColor: firstColor(...configs.map((config) => config?.textColor)),
    backgroundColor: firstColor(...configs.map((config) => config?.backgroundColor)),
    iconColor: firstColor(...configs.map((config) => config?.iconColor)),
  }
}

/**
 * Per-button colors from Card Settings. Sets CSS variables the themed
 * `.vbiz-social` / `.vbiz-icon-btn` / `.vbiz-btn` rules already read, so
 * `!important` theme tokens still apply — but use the owner's color when set.
 * Unset fields keep light/dark theme tokens.
 */
export function displaySocialChromeStyle(config?: DisplayFieldConfig): CSSProperties | undefined {
  const fill = firstColor(config?.backgroundColor)
  const fg = firstColor(config?.iconColor, config?.textColor)
  if (!fill && !fg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (fill) {
    style['--vbiz-social-fill'] = fill
    style['--vbiz-social-border-color'] = fill
    style.backgroundColor = fill
  }
  if (fg) {
    style['--vbiz-social-fg'] = fg
    style.color = fg
  }
  return style
}

export function displayIconChromeStyle(config?: DisplayFieldConfig): CSSProperties | undefined {
  const fill = firstColor(config?.backgroundColor)
  const fg = firstColor(config?.iconColor, config?.textColor)
  if (!fill && !fg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (fill) {
    style['--vbiz-btn-secondary-fill'] = fill
    style['--vbiz-btn-secondary-border-color'] = fill
    style.backgroundColor = fill
  }
  if (fg) {
    style['--vbiz-btn-secondary-fg'] = fg
    style.color = fg
  }
  return style
}

export function displayCtaChromeStyle(config?: DisplayFieldConfig): CSSProperties | undefined {
  const fill = firstColor(config?.backgroundColor)
  const fg = firstColor(config?.textColor, config?.iconColor)
  if (!fill && !fg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (fill) {
    style['--vbiz-btn-fill'] = fill
    style['--vbiz-btn-accent-fill'] = fill
    style['--vbiz-btn-primary-fill'] = fill
    style['--vbiz-btn-secondary-fill'] = fill
  }
  if (fg) {
    style['--vbiz-btn-fg'] = fg
    style['--vbiz-btn-accent-fg'] = fg
    style['--vbiz-btn-primary-fg'] = fg
    style['--vbiz-btn-secondary-fg'] = fg
  }
  return style
}

export function displayLiveAgentChromeStyle(config?: DisplayFieldConfig): CSSProperties | undefined {
  const fill = firstColor(config?.backgroundColor)
  const fg = firstColor(config?.iconColor, config?.textColor)
  if (!fill && !fg) return undefined
  const style: CSSPropertiesWithVariables = {}
  if (fill) style['--vbiz-live-agent-fill'] = fill
  if (fg) style['--vbiz-live-agent-fg'] = fg
  return style
}

/**
 * Card Settings → General. Sets scoped CSS variables on the profile root.
 * Home/banner/header colors apply only to those areas; `--vbiz-bg` / `--vbiz-surface`
 * still swap with dark/light.
 */
export function displayGeneralRootStyle(settings: VCardDisplaySettings): CSSProperties | undefined {
  const style: CSSPropertiesWithVariables = {}
  const pageBg = getFieldConfig(settings, 'Home Page BG Color')
  const pageBanner = getFieldConfig(settings, 'Home Page Banner Color')
  const pagesHeader = getFieldConfig(settings, 'Pages Header')

  if (pageBg.visible !== false) {
    const fill = firstColor(pageBg.backgroundColor)
    if (fill) style['--vbiz-home-bg'] = fill
  }
  if (pageBanner.visible !== false) {
    const fill = firstColor(pageBanner.backgroundColor)
    if (fill) style['--vbiz-home-banner'] = fill
  }
  if (pagesHeader.visible !== false) {
    const fg = firstColor(pagesHeader.textColor, pagesHeader.iconColor)
    const fill = firstColor(pagesHeader.backgroundColor)
    if (fg) style['--vbiz-page-header-fg'] = fg
    if (fill) style['--vbiz-page-header-fill'] = fill
  }

  return Object.keys(style).length > 0 ? style : undefined
}

export function isPagesHeaderVisible(settings: VCardDisplaySettings): boolean {
  return getFieldConfig(settings, 'Pages Header').visible !== false
}
