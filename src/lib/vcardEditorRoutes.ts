import { getNavItemById } from '@/lib/vcardNavbar'

export const EDITOR_SETTINGS_ID = 'settings'
export const DEFAULT_EDITOR_SECTION = 'home'
export const DEFAULT_PERSONAL_SUB_TAB = 1
export const DEFAULT_SETTINGS_TAB = 'info'

export const SETTINGS_TAB_IDS = ['info', 'social', 'icons', 'general', 'home', 'navbar', 'template'] as const

export type SettingsTabId = (typeof SETTINGS_TAB_IDS)[number]

export type ParsedEditorRoute = {
  sectionId: string
  subTab?: number
  settingsTab?: SettingsTabId
  isSettings: boolean
}

export type EditorBasePath = '/vcards/create' | '/vcards/edit'

function defaultSubTabForSection(sectionId: string): number | undefined {
  const navItem = getNavItemById(sectionId)
  if (navItem?.editorPanel.kind === 'personal') {
    return navItem.editorPanel.subTab ?? DEFAULT_PERSONAL_SUB_TAB
  }
  return undefined
}

function parseSettingsTab(value: string | undefined): SettingsTabId {
  if (value && (SETTINGS_TAB_IDS as readonly string[]).includes(value)) {
    return value as SettingsTabId
  }
  return DEFAULT_SETTINGS_TAB
}

export function parseEditorSegments(segments: string[] | undefined): ParsedEditorRoute {
  const segs = segments ?? []

  if (segs.length === 0) {
    return {
      sectionId: DEFAULT_EDITOR_SECTION,
      isSettings: false,
      subTab: defaultSubTabForSection(DEFAULT_EDITOR_SECTION),
    }
  }

  if (segs[0] === EDITOR_SETTINGS_ID) {
    return {
      sectionId: EDITOR_SETTINGS_ID,
      isSettings: true,
      settingsTab: parseSettingsTab(segs[1]),
    }
  }

  const sectionId = segs[0]
  const maybeSubTab = segs[1]

  if (maybeSubTab && /^\d+$/.test(maybeSubTab)) {
    return {
      sectionId,
      isSettings: false,
      subTab: parseInt(maybeSubTab, 10),
    }
  }

  return {
    sectionId,
    isSettings: false,
    subTab: defaultSubTabForSection(sectionId),
  }
}

export function buildEditorPath(
  basePath: EditorBasePath,
  options: {
    sectionId?: string
    subTab?: number
    settingsTab?: SettingsTabId
  },
  cardId?: string | null
): string {
  const sectionId = options.sectionId ?? DEFAULT_EDITOR_SECTION
  let path = basePath

  if (sectionId === EDITOR_SETTINGS_ID) {
    path += '/settings'
    const tab = options.settingsTab ?? DEFAULT_SETTINGS_TAB
    if (tab !== DEFAULT_SETTINGS_TAB) {
      path += `/${tab}`
    }
  } else {
    path += `/${sectionId}`
    const navItem = getNavItemById(sectionId)
    if (
      navItem?.editorPanel.kind === 'personal' &&
      options.subTab != null &&
      options.subTab !== DEFAULT_PERSONAL_SUB_TAB
    ) {
      path += `/${options.subTab}`
    }
  }

  if (cardId) {
    path += `?cardId=${encodeURIComponent(cardId)}`
  }

  return path
}

export function buildEditorSectionPath(basePath: EditorBasePath, sectionId: string, cardId?: string | null): string {
  const navItem = getNavItemById(sectionId)
  const subTab =
    navItem?.editorPanel.kind === 'personal' && navItem.editorPanel.subTab ? navItem.editorPanel.subTab : undefined

  return buildEditorPath(basePath, { sectionId, subTab }, cardId)
}

export function buildEditorSettingsPath(
  basePath: EditorBasePath,
  settingsTab: SettingsTabId = DEFAULT_SETTINGS_TAB,
  cardId?: string | null
): string {
  return buildEditorPath(basePath, { sectionId: EDITOR_SETTINGS_ID, settingsTab }, cardId)
}

export function isValidEditorSection(sectionId: string): boolean {
  return sectionId === EDITOR_SETTINGS_ID || Boolean(getNavItemById(sectionId))
}
