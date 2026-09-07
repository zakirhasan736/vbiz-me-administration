import { DISPLAY_SETTINGS_SETTING_KEY, LABEL_TO_NAV_CHECKBOX } from '@/lib/api/myCard/mapDisplaySettingsToApi'
import { attachmentTypeToDisplayField, sameMediaUrl } from '@/lib/media/attachmentTypeMatch'
import { shouldPreserveCustomNavOrder } from '@/lib/publicNavOrder'
import {
  ALL_DISPLAY_FIELD_KEYS,
  applyEnabledNavOrderToDisplaySettings,
  createDefaultDisplaySettings,
  createDefaultFieldConfig,
} from '@/lib/vcardDisplaySettings'
import { LOCKED_NAV_ITEM_IDS, NAV_BAR_NAV_ITEMS, createDefaultNavFieldConfig } from '@/lib/vcardNavbar'
import type { VCardDisplaySettings } from '@/types/vcardDisplaySettings'

export type ProfileSettingRow = { key: string; value: string | null }
export type ProfileAttachmentRow = {
  url?: string | null
  path?: string | null
  fileUrl?: string | null
  docName?: string | null
  attachmentType?: { name?: string | null } | null
}

/** Setting key → display field label (write path inverse). */
const SETTING_TO_FIELD: Record<string, string> = {
  intro_video_url: 'Intro vCard Video',
  intro_youtube_url: 'Intro YouTube vCard Video Link',
  background_media_url: 'Background Video/Image',
  profile_media_url: 'Profile Image/Video',
  background_music_file_url: 'Background Music',
  background_music_url: 'YouTube Background Music Link',
  company_icon_url: 'Company/Office Icon',
}

function isYoutubeMediaUrl(url: string): boolean {
  return /youtu\.?be/i.test(url)
}

function isDurableHttpUrl(url: string): boolean {
  const trimmed = url.trim()
  if (!trimmed || trimmed.startsWith('blob:')) return false
  return /^https?:\/\//i.test(trimmed) || trimmed.startsWith('/')
}

function parseDisplaySettingsSnapshot(raw?: string): VCardDisplaySettings | null {
  if (!raw?.trim()) return null
  try {
    const parsed = JSON.parse(raw) as VCardDisplaySettings
    if (!parsed || typeof parsed !== 'object' || !parsed.fields || typeof parsed.fields !== 'object') {
      return null
    }
    return parsed
  } catch {
    return null
  }
}

export function settingsRowsToMap(settings?: ProfileSettingRow[] | null): Record<string, string> {
  const map: Record<string, string> = {}
  if (!settings) return map
  for (const row of settings) {
    if (!row?.key) continue
    map[row.key] = row.value ?? ''
  }
  return map
}

function attachmentUrl(att: ProfileAttachmentRow): string {
  const raw = (att.url || att.fileUrl || att.path || '').trim()
  return isDurableHttpUrl(raw) ? raw : ''
}

function attachmentFieldLabel(att: ProfileAttachmentRow): string | null {
  return attachmentTypeToDisplayField(att.attachmentType?.name)
}

function setFieldCustomValue(fields: VCardDisplaySettings['fields'], key: string, url: string) {
  if (!url || !isDurableHttpUrl(url)) return
  fields[key] = {
    ...(fields[key] || createDefaultFieldConfig()),
    customValue: url,
  }
}

export type HydrateDisplaySettingsInput = {
  settings?: ProfileSettingRow[] | null
  attachments?: ProfileAttachmentRow[] | null
  /** Profile.avatar column — used for Profile Image/Video fallback. */
  avatar?: string | null
  slug?: string | null
}

export type HydrateDisplaySettingsResult = {
  displaySettings: VCardDisplaySettings
  settingsMap: Record<string, string>
  avatarImageUrl: string
  /** Cover media from Background Video/Image (image or video URL). */
  backgroundImageUrl: string
  explainerVideoUrl: string
}

/**
 * Rebuild editor displaySettings media customValues from GET /profiles/:id
 * settings rows + attachments (same sources the public myCard path uses).
 */
export function hydrateDisplaySettingsFromProfile(input: HydrateDisplaySettingsInput): HydrateDisplaySettingsResult {
  const settingsMap = settingsRowsToMap(input.settings)
  const snapshot = parseDisplaySettingsSnapshot(settingsMap[DISPLAY_SETTINGS_SETTING_KEY])
  const base = createDefaultDisplaySettings([...ALL_DISPLAY_FIELD_KEYS])
  const fields: VCardDisplaySettings['fields'] = { ...base.fields }

  if (snapshot?.fields) {
    for (const [label, config] of Object.entries(snapshot.fields)) {
      const customValue = config.customValue?.trim() || ''
      fields[label] = {
        ...createDefaultFieldConfig(),
        ...fields[label],
        ...config,
        customValue: customValue.startsWith('blob:') ? '' : customValue,
      }
    }
  }

  /** Setting keys that were intentionally cleared (present + empty) — do not revive from attachments. */
  const clearedFields = new Set<string>()

  // Overlay dedicated setting keys (authoritative for media URLs, including empty clears).
  for (const [settingKey, fieldKey] of Object.entries(SETTING_TO_FIELD)) {
    if (!Object.prototype.hasOwnProperty.call(settingsMap, settingKey)) continue
    const value = settingsMap[settingKey]?.trim() || ''
    if (!value) {
      clearedFields.add(fieldKey)
      fields[fieldKey] = {
        ...(fields[fieldKey] || createDefaultFieldConfig()),
        customValue: '',
      }
      continue
    }
    if (fieldKey === 'Intro vCard Video' && isYoutubeMediaUrl(value)) {
      setFieldCustomValue(fields, 'Intro YouTube vCard Video Link', value)
      continue
    }
    if (fieldKey === 'YouTube Background Music Link' && !isYoutubeMediaUrl(value)) {
      setFieldCustomValue(fields, 'Background Music', value)
      continue
    }
    if (fieldKey === 'Background Music' && isYoutubeMediaUrl(value)) {
      setFieldCustomValue(fields, 'YouTube Background Music Link', value)
      continue
    }
    setFieldCustomValue(fields, fieldKey, value)
  }

  // Attachment fallbacks only when that media setting was never written (legacy cards).
  for (const att of input.attachments || []) {
    const field = attachmentFieldLabel(att)
    const url = attachmentUrl(att)
    if (!field || !url) continue
    if (clearedFields.has(field)) continue
    const existing = fields[field]?.customValue?.trim() || ''
    if (existing) continue
    if (field === 'Intro vCard Video' && isYoutubeMediaUrl(url)) {
      if (!fields['Intro YouTube vCard Video Link']?.customValue?.trim()) {
        setFieldCustomValue(fields, 'Intro YouTube vCard Video Link', url)
      }
      continue
    }
    setFieldCustomValue(fields, field, url)
  }

  const avatarFromSettings = fields['Profile Image/Video']?.customValue?.trim() || ''
  const avatarFromColumn = (input.avatar || '').trim()
  const profileCleared = clearedFields.has('Profile Image/Video')
  const avatarImageUrl = profileCleared
    ? ''
    : (isDurableHttpUrl(avatarFromSettings) ? avatarFromSettings : '') ||
      (isDurableHttpUrl(avatarFromColumn) ? avatarFromColumn : '') ||
      ''

  if (!profileCleared && avatarImageUrl && !fields['Profile Image/Video']?.customValue?.trim()) {
    setFieldCustomValue(fields, 'Profile Image/Video', avatarImageUrl)
  }

  // Contaminated cards: identical intro+background URLs with only an Intro attachment → keep intro only.
  const introFileUrl = fields['Intro vCard Video']?.customValue?.trim() || ''
  const backgroundCandidate = fields['Background Video/Image']?.customValue?.trim() || ''
  if (introFileUrl && backgroundCandidate && sameMediaUrl(introFileUrl, backgroundCandidate)) {
    let hasIntroAttachment = false
    let hasBackgroundAttachment = false
    for (const att of input.attachments || []) {
      const field = attachmentFieldLabel(att)
      const url = attachmentUrl(att)
      if (!url || !sameMediaUrl(url, introFileUrl)) continue
      if (field === 'Intro vCard Video') hasIntroAttachment = true
      if (field === 'Background Video/Image') hasBackgroundAttachment = true
    }
    if (hasIntroAttachment && !hasBackgroundAttachment) {
      fields['Background Video/Image'] = {
        ...(fields['Background Video/Image'] || createDefaultFieldConfig()),
        customValue: '',
      }
    }
  }

  const backgroundFromSettings = fields['Background Video/Image']?.customValue?.trim() || ''
  const backgroundImageUrl = isDurableHttpUrl(backgroundFromSettings) ? backgroundFromSettings : ''

  const introYoutube = fields['Intro YouTube vCard Video Link']?.customValue?.trim() || ''
  const explainerVideoUrl = introYoutube && isYoutubeMediaUrl(introYoutube) ? introYoutube : ''

  const editorNavOrder = Array.isArray(snapshot?.editorNavOrder)
    ? snapshot.editorNavOrder.filter((id): id is string => typeof id === 'string' && Boolean(id))
    : []

  const displaySettings: VCardDisplaySettings = {
    globalEnabled: snapshot?.globalEnabled ?? true,
    fields,
    ...(editorNavOrder.length ? { editorNavOrder } : {}),
    ...(snapshot?.navOrderCustomized ? { navOrderCustomized: true } : {}),
  }

  if (!editorNavOrder.length) {
    for (const item of NAV_BAR_NAV_ITEMS) {
      displaySettings.fields[item.label] = {
        ...(displaySettings.fields[item.label] || createDefaultNavFieldConfig(item.label)),
        visible: LOCKED_NAV_ITEM_IDS.has(item.id),
      }
    }
    for (const [label, checkbox] of Object.entries(LABEL_TO_NAV_CHECKBOX)) {
      if (label === 'Nav Background Color') continue
      const raw = settingsMap[checkbox]
      if (raw === undefined) continue
      displaySettings.fields[label] = {
        ...(displaySettings.fields[label] || createDefaultNavFieldConfig(label)),
        visible: raw === '1' || raw === 'true',
      }
    }
    for (const item of NAV_BAR_NAV_ITEMS) {
      if (!LOCKED_NAV_ITEM_IDS.has(item.id)) continue
      displaySettings.fields[item.label] = {
        ...(displaySettings.fields[item.label] || createDefaultNavFieldConfig(item.label)),
        visible: true,
      }
    }
  }

  return {
    displaySettings: editorNavOrder.length
      ? applyEnabledNavOrderToDisplaySettings(displaySettings, editorNavOrder, {
          preserveCustom: shouldPreserveCustomNavOrder(input.slug, snapshot?.navOrderCustomized),
        })
      : displaySettings,
    settingsMap,
    avatarImageUrl,
    backgroundImageUrl,
    explainerVideoUrl,
  }
}
